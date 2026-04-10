# TEXNIK TOPSHIRIQ (TZ) - Frontend qismida Chat imkoniyatini yaratish (Kengaytirilgan versiya)

Ushbu hujjat Frontend Agent (yoki dasturchi) uchun mo'ljallangan. 
Backendda Real-time (Chat, Typing, Online/Offline, Unread counts) to'liq qo'llab quvvatlash rejimiga o'tkazildi.

---

## 🔗 1. Kerakli Kutubxonalar

Quyidagi paketni React loyihaga o'rnating:
```bash
npm install socket.io-client
```

---

## 🛠️ 2. REST API (Tarix va ma'lumotlarni tortish)

### 2.1 Barcha Chatlarni olish (Ro'yxat)
Foydalanuvchining barcha yozishmalarini olib beradi. **E'tibor bering: Endi ro'yxat eng yangi xabar vaqti bo'yicha saralangan holds keladi va o'qilmaganlar soni ("unread count") ga ega.**
- **Method:** `GET /chats/user/:userId`
- **Qaytaradi:**:
```json
[
  {
    "id": 1,
    "unreadCount": 2, // SHU CHATDAGI O'QILMAGAN XABARLAR SONI ❗️ 
    "users": [
      { "id": 1, "username": "ali", "isOnline": true, "lastSeen": "2026..." },
      { "id": 2, "username": "vali", "isOnline": false, "lastSeen": "..." }
    ],
    "messages": [ { "text": "Salom...", "createdAt": "..." } ] // Oxirgi 1 ta xabar preview uchun
  }
]
```

### 2.2 Yangi chat ochish yoki Eskisini topish
- **Method:** `POST /chats/start`
- **Body:** `{ "userId1": o'z_IDsi, "userId2": suhbatdosh_IDsi }`

### 2.3 Xabarlar tarixini yuklash (Chat ichi)
- **Method:** `GET /chats/:chatId/messages`
- **Javobda:** har bir xabar endi `isRead` parametrini qaytaradi (to'gri tahlil qilib "✓" yoki "✓✓" vizualida ko'rsating).

---

## ⚡ 3. WebSocket - Jonli Yozishma va Litsenziyalar

Real-time xususiyatlari uchun barcha eventlar tayyor.

```javascript
import { io } from "socket.io-client";

// Backend URL ni o'zingizning API linkizizga yoki tunnelga moslang
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000"); 

export default function ChatRoom({ chatId, currentUser }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // ==========================================
    // 0. TIZIMGA ULANISH (ONLINE STATUS UCHUN)
    // ==========================================
    // Saytga kirishi bilanoq barcha do'stlarga uning onlayn ekanini bildiramiz:
    socket.emit("user_connected", currentUser.id);

    // ==========================================
    // 1. CHAT XONASIGA QO'SHILISH
    // ==========================================
    socket.emit("join_chat", chatId);

    // ==========================================
    // 2. O'QILDI ("READ RECEIPTS") - FOKUS
    // ==========================================
    // Agar fayzalanuvchi ushbu oynani ochib o'tirgan bo'lsa darhol kelgan "o'qilmagan" (boshqalarga tegishli)
    // xabarlarni o'qildi deymiz.
    socket.emit("mark_as_read", { chatId, userId: currentUser.id });

    // ==========================================
    // 3. LISTENERS (QABUL QILISH HODISALARI)
    // ==========================================
    
    // a) Yangi xabar kelishi
    socket.on("receive_message", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      // Agar ochiq oynada tursangiz, yangi kelganini ham darxol o'qilgan qilib quyishimiz mumkin:
      socket.emit("mark_as_read", { chatId, userId: currentUser.id });
    });

    // b) Suhbatdosh xabarni o'qidi ("✓✓")
    socket.on("messages_read", ({ chatId, readBy }) => {
       // Bu yerda messages statedagi isRead=false larni isRead=true deb o'zgaritib ko'yish kerak
       setMessages(prev => prev.map(m => m.userId !== readBy ? { ...m, isRead: true } : m));
    });

    // c) "<Ism> yozmoqda..." (Typing indicator)
    socket.on("typing", ({ chatId, userId }) => {
       // "Typing..." animatsiyasini false dan true qilib ko'rsating
    });
    socket.on("stop_typing", ({ chatId, userId }) => {
       // "Typing..." animatsiyasini yashiring
    });

    // d) Foalanuvchi tirmokda kirdi-chiqdi (Online status updates)
    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      // Userlar ro'yhati va sarlavhadagi holat qatorlarini shunga asosan yangilang
    });

    return () => {
      socket.off("receive_message");
      socket.off("messages_read");
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("user_status");
    };
  }, [chatId]);

  // ==========================================
  // XABAR YUBORISH MANTIQI
  // ==========================================
  const sendMessage = (text) => {
    socket.emit("send_message", {
      chatId,
      userId: currentUser.id,
      text
    });
    // typing o'chirish
    socket.emit("stop_typing", { chatId, userId: currentUser.id });
  };

  // Inputga yozayotganda
  const onInputType = (e) => {
     socket.emit("typing", { chatId, userId: currentUser.id });
     // debounce qilib ma'lum soniyadan kegin stop_typing yuborish esdan chiqmasin
  }
}
```

## 📝 4. Asosiy e'tibor qaratiladigan UX Talablar
1. Ro'yxat eng yangi xabariga qarab saralanib turadi. Agar yangi xabar yuborilsa yoki kelsa Frontend shuni eng tepaga o'tkazishi kerak.
2. `unreadCount` aylanachasi (badge)ni faqat qiymat 0 dan katta botlsagina ko'rsating.
3. Chat ichida "O'qilganlik tikuvi (✓ / ✓✓)" to'g'ri algoritmlanganiga ishonch hosil qiling. Birovning yuborgan xabarida pichka chiqmaydi. O'zingiznikida chiqadi.
4. Inputda **debounce** yordamida har bitta xarfdan so'ng `typing` yubormang, taymer qo'yib ozgina optimizatsiya qiling.
