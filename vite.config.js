import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/score-normalizer/", // <--- THIS IS CRITICAL
})
```

### Step 4: Configure `package.json`
Open `package.json`. You need to add two lines inside the `"scripts"` section.

Add `"predeploy"` and `"deploy"` so it looks like this:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "predeploy": "npm run build",        
    "deploy": "gh-pages -d dist"       
  },
```

### Step 5: Connect and Upload (The Git Part)
Run these commands one by one in your terminal. 

*Replace `YOUR_GITHUB_USERNAME` with your actual username.*

```bash
# 1. Initialize Git
git init

# 2. Add all files
git add .

# 3. Save the changes
git commit -m "Initial launch"

# 4. Connect to your GitHub repo (Replace USERNAME below!)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/score-normalizer.git

# 5. Push the code
git branch -M main
git push -u origin main
```

### Step 6: Deploy to the Web
Now that the code is on GitHub, run this final command in your terminal to create the website:

```bash
npm run deploy