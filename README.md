# civitai-auto-like-script
 Tampermonkey script to automatically like Civitai images

This script is useful for quickly supporting creators, with a built-in limit of 100 likes per session.

---

## 🔧 Features

- ✅ Automatically clicks "Like" on image posts
- ✅ Scrolls down to load more images
- ✅ Maximum of 100 likes per run (changeable in the script)
- ✅ Real-time progress bar and status message
- ✅ Error log display for debugging
- ✅ Manual Start/Stop button for control

---

## 📥 How to Install

1. Install [Tampermonkey](https://tampermonkey.net/) extension in your browser.
2. Click the Tampermonkey icon > "Create a new script".
3. Replace the default code with the contents of `civitai-auto-like.user.js`.
4. Save the script (File > Save or `Ctrl + S`).
5. Visit [https://civitai.com/images](https://civitai.com/images).
6. The script will run automatically after 3 seconds, or you can click the **Start** button in the popup UI.

---

## 📋 Script Behavior

- The script scrolls down and loads up to 100 images.
- It checks if each image is already liked.
- If not, it clicks the like button.
- Progress is shown in a floating UI at the top-right corner.
- You can click "Stop" at any time to cancel the operation.
- The UI disappears once all likes are processed.

---

## ⚠️ Notes

- Make sure you're logged in to your Civitai account.
- You can switch accounts and re-run the script to like from multiple profiles.
- The default like limit is `50`, but you can change the `MAX_LIKES` value in the script.
- If the script doesn't run, check that it’s enabled in Tampermonkey and that permissions are correct.

---

## 📌 License

MIT License – free to use, modify, and share.

---

Made with ❤️ by [zap] (or leave anonymous).
