# TEXNIK TOPSHIRIQ (TZ) - Frontend qismida Chat imkoniyatini yaratish

Ushbu hujjat Frontend Agent (yoki dasturchi) uchun mo'ljallangan va backendda qilingan chat imkoniyatlarini ulash tartibini tushuntiradi.

## 🎯 Asosiy Maqsadlar
Frontend dasturida:
1. Foydalanuvchining barcha chatlari (yozishmalari) ro'yxatini chiqarish.
2. Ikki foydalanuvchi o'rtasida "Shaxsiy Chat" oynasini yaratish.
3. Chat ichida xabarlarni tarix bilan chiqarish.
4. WebSocket (socket.io) orqali xabarlarni jonli (real-time) qabul qilish va yuborish.

---

## 🔗 1. Kerakli Kutubxonalar

Quyidagi paketni React loyihaga o'rnating:
```bash
npm install socket.io-client
```

---

## 🛠️ 2. REST API (Tarix va ma'lumotlarni tortish)

Hozirgi Backendda 3 ta muhim API bor. API larni Axios bilan odatdagidek chaqirasiz. Auth uchun JWT Token yuborish esdan chiqmasin (agar backend talab qilsa).

### 2.1 Yangi chat ochish yoki Eskisini topish
Foydalanuvchi qidiruvdan yoki profildan kimgadir "Xabar yozish" tugmasini bossa, aniq shu chatni (`chatId`) topib olish uchun ishlatiladi.
- **Method:** `POST /chats/start`
- **Body:** `{ "userId1": o'z_IDsi, "userId2": suhbatdosh_IDsi }`
- **Qaytaradi:** Chat obyekti (ichi `.id` xususiyatiga ega). Ushbu `id` ni olib keyingi bosqichda sockerga yuborasiz!

### 2.2 Barcha Chatlarni olish (Ro'yxat)
Foydalanuvchi "Mening chatlarim" bo'limiga kirganida.
- **Method:** `GET /chats/user/:userId`
- **Qaytaradi:** Array ko'rinishida chatlar ro'yxati. Har birida kimlar borligi va oxirgi bitta xabar kiritilgan bo'ladi.

### 2.3 Xabarlar tarixini yuklash (Chat ichi)
Foydalanuvchi qaysidir chatga kirganida uning hamma avvalgi xabarlarini chiqarib beradi.
- **Method:** `GET /chats/:chatId/messages`
- **Qaytaradi:** Xabarlar qatori (`[ { id, text, user: {...}, createdAt }, ... ]`)

---

## ⚡ 3. WebSocket - Jonli Yozishma (Socket.IO)

Xonada xabarlarni real-time almashishi uchun socket.io o'rnatiladi. Ulanishni React `useEffect` ichida bajaring va **backend manzilini bering (masalan Cloudflare tunnel linki)**.

```javascript
import { io } from "socket.io-client";

// Backend URL ni o'zingizning API linkizizga yoki tunnelga moslang
// Masalan: https://some-tunnel.trycloudflare.com
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000"); 

export default function ChatRoom({ chatId, currentUser }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // 1-QADAM: Chat xonasiga qo'shilish 
    // AGAR BU QILINMASA, xabarlar ikkinchi odamga yetib kelmaydi!
    socket.emit("join_chat", chatId);

    // 2-QADAM: Boshqalar yozgan xabarni kutish va tutib olish
    socket.on("receive_message", (newMessage) => {
      // Yangi kelgan xabarni oynaga qo'shamiz
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      // Komponent o'chganda (unmount) tozalaymiz
      socket.off("receive_message");
    };
  }, [chatId]);

  // Jonli yuborish
  const sendMessage = (text) => {
    // Frontenddan backendga xabar otamiz
    socket.emit("send_message", {
      chatId: chatId,
      userId: currentUser.id,
      text: text
    });
    
    // Yuborgan xabarimizni UX tezligi uchun o'zimizga ham qo'lda qo'shib qoyishimiz mumkin (ixtiyoriy)
    // Yoki backend "receive_message" qilib qaytarishini kutish ham mumkin
  };

  // HTML da setMessages va sendMessage ishtirok etishi kerak...
}
```

## 📝 4. Natija Qo'yiladigan Talablar
O'zingiz ishga kirishayotganda ushbu talablarga e'tibor bering:
1. **Chatlar ro'yxatida:** eng oxirgi yozilgan xabar (snippet/preview) ko'rinib tursin.
2. **Scroll:** Chatga kirganda avtomatik eng pastga (eng yangi xabarlarga) tushib tursin.
3. **Jonli ulanish himoyasi:** Agar foydalanuvchi uzilib qolsa (internet ketib qolsa), xabarlar yo'qolmasligi uchun ulanish tiklanganda `GET /chats/:chatId/messages` orqali yana bir bor ma'lumotni sinxron qilib oling.

> **Ushbu texnik topshiriqda ko'rsatilgan strukturadan chetga chiqmang, barcha API va event nomlari aynan backenddagi kabi bo'lishi shart!**
