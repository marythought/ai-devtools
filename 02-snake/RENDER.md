# Deploy to Render

This guide walks you through deploying your Snake Game to Render.

## Why Render?

- **Free Tier**: Free web services with 750 hours/month
- **Easy Setup**: Auto-deploys from GitHub
- **Docker Support**: Uses your existing Dockerfile
- **Add PostgreSQL**: One-click database (optional, $7/month)
- **Custom Domains**: Free SSL certificates

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com) (free)

## Quick Deploy (5 minutes)

### Step 1: Push to GitHub

If you haven't already:

```bash
cd /Users/marydickson/Code/ai-devtools/02-snake

# Initialize git (if needed)
git init
git add .
git commit -m "Initial commit: Snake Game ready for deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/snake-game.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** and authorize Render
4. Select your `snake-game` repository

### Step 3: Configure Service

Render should auto-detect your `render.yaml` file. If not, configure manually:

**Service Details:**
- **Name**: `snake-game` (or your choice)
- **Region**: Oregon (Free)
- **Branch**: `main`
- **Runtime**: Docker
- **Dockerfile Path**: `docker/Dockerfile`
- **Docker Context**: `.` (root directory)

**Plan:**
- Select **Free** tier

### Step 4: Environment Variables

Render will auto-generate `SECRET_KEY` from render.yaml. You can also add it manually:

1. Scroll to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Add:
   - **Key**: `SECRET_KEY`
   - **Value**: Your generated key (see below)
   - **Key**: `ENVIRONMENT`
   - **Value**: `production`

**Generate SECRET_KEY** (if needed):
```bash
openssl rand -base64 32
```

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Build the Docker image (~5-10 minutes)
   - Deploy the container
   - Assign you a URL: `https://snake-game-xxxx.onrender.com`

3. Watch the build logs in real-time

## Post-Deployment

### Access Your App

Once deployed, you'll get a URL like:
```
https://snake-game-xxxx.onrender.com
```

Click it to see your live Snake Game!

### Test It

1. Create an account
2. Play a game
3. Check the leaderboard
4. Try spectator mode

### Auto-Deploy

Every time you push to GitHub `main` branch, Render will automatically:
1. Pull the latest code
2. Rebuild the Docker image
3. Deploy the new version

**To deploy updates:**
```bash
git add .
git commit -m "Update: description of changes"
git push
```

## Add PostgreSQL Database (Optional)

For persistent data across deployments:

### Step 1: Create PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. **Name**: `snake-game-db`
3. **Database**: `snakedb`
4. **User**: `snakeuser`
5. **Region**: Same as your web service (Oregon)
6. **Plan**: Starter ($7/month) or Free (expires after 90 days)
7. Click **"Create Database"**

### Step 2: Connect to Web Service

1. Go to your **snake-game** web service
2. Click **"Environment"** tab
3. Add new environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Click **"Insert"** → Select your PostgreSQL database → Choose **"Internal Database URL"**

4. Click **"Save Changes"**
5. Render will automatically redeploy with PostgreSQL

### Step 3: Verify

Your app now uses PostgreSQL! Data persists across deployments.

## Custom Domain (Optional)

### Add Your Domain

1. In your web service, go to **"Settings"**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain: `snakegame.yourdomain.com`
5. Render provides DNS settings
6. Add CNAME record to your DNS provider:
   ```
   CNAME snakegame your-service.onrender.com
   ```
7. Wait for DNS propagation (~1 hour)
8. Render automatically provisions SSL certificate

## Troubleshooting

### Build Fails

**Check build logs:**
1. In Render Dashboard, click your service
2. Go to **"Events"** or **"Logs"** tab
3. Look for errors in the build output

**Common issues:**
- Missing files: Check `.dockerignore` isn't excluding necessary files
- Path errors: Ensure `docker/Dockerfile` path is correct
- Large build: Free tier has resource limits

### App Won't Start

**Check runtime logs:**
1. Go to **"Logs"** tab
2. Look for Python/Nginx errors

**Common issues:**
- Missing `SECRET_KEY`: Add it in Environment Variables
- Port issues: Ensure app listens on port 80 (already configured)

### App is Slow

**Free tier limitations:**
- Spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading to **Starter** plan ($7/month) for always-on

### Database Connection Errors

**Check:**
1. `DATABASE_URL` environment variable is set correctly
2. Database is in same region as web service
3. Database is running (check database dashboard)

## Monitoring

### View Logs

```bash
# Or view in Render Dashboard → Logs tab
```

**Live logs show:**
- HTTP requests
- Application errors
- Supervisor status (nginx + uvicorn)

### Metrics

In Render Dashboard:
- **CPU Usage**
- **Memory Usage**
- **Bandwidth**
- **Deploy History**

## Upgrading Plans

### Free Tier Limits
- 750 hours/month
- Spins down after inactivity
- 512 MB RAM
- 0.1 CPU

### Starter Plan ($7/month)
- Always on (no spin-down)
- 512 MB RAM
- 0.5 CPU
- Better for production

### To Upgrade
1. Go to **"Settings"** → **"Plan"**
2. Select **"Starter"**
3. Add payment method

## Environment Management

### Multiple Environments

Create separate services for staging/production:

**Production:**
```yaml
# render.yaml (main branch)
services:
  - name: snake-game-prod
    ...
```

**Staging:**
1. Create new service pointing to `develop` branch
2. Use different domain/environment variables

## Rollback

### Revert to Previous Deploy

1. Go to **"Events"** tab
2. Find successful previous deploy
3. Click **"Rollback to this version"**
4. Confirm

## Cost Estimation

**Free Tier:**
- Web Service: Free (with limitations)
- Database: Not included (or free for 90 days)
- **Total**: $0/month

**Production Setup:**
- Web Service (Starter): $7/month
- PostgreSQL (Starter): $7/month
- Custom Domain: Free
- **Total**: ~$14/month

## Security Best Practices

1. **SECRET_KEY**: Use auto-generated value, never commit to git
2. **HTTPS**: Automatically enabled by Render
3. **DATABASE_URL**: Use internal database URL for better security
4. **Environment Variables**: Store all secrets in Render Dashboard, not in code

## Next Steps

Once deployed:

1. **Test thoroughly** - Create accounts, play games, check leaderboard
2. **Monitor logs** - Watch for errors or issues
3. **Set up domain** - Use custom domain for professional look
4. **Add database** - For persistent data
5. **Share** - Give friends your URL to try the game!

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)

## Useful Commands

```bash
# View render.yaml
cat render.yaml

# Test Docker build locally
docker build -f docker/Dockerfile -t snake-game:latest .
docker run -p 80:80 -e SECRET_KEY="test-key" snake-game:latest

# Push updates
git add .
git commit -m "Update: feature description"
git push  # Auto-deploys to Render
```

---

**Your Snake Game is now live! 🎉🐍**
