import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN")
PAY_LINK = "https://t.me/yourpaybot" # حط رابط الدفع مالك هنا بعدين
FILE_LINK = "https://drive.google.com/..." # حط رابط ملف الـ 100 سكريبت هنا

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    kb = [[InlineKeyboardButton("💳 ادفع 29$ USDT", url=PAY_LINK)], [InlineKeyboardButton("✅ اني دفعت", callback_data="paid")]]
    await update.message.reply_text("🔥 100 TikTok Shop Scripts\nالسعر 29$ - التوصيل فوري", reply_markup=InlineKeyboardMarkup(kb))

async def check(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.callback_query.answer()
    await update.callback_query.message.reply_text(f"عاشت ايدك! هذا ملفك:\n{FILE_LINK}")

app = Application.builder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(CallbackQueryHandler(check))
app.run_polling()
