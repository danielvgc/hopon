# Google Maps Setup for HopOn

This guide explains how to set up Google Maps API for the HopOn application.

## Getting a Google Maps API Key

1. **Go to Google Cloud Console**: Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)

2. **Create a new project** (or select an existing one)

3. **Enable required APIs**:
   - Go to "APIs & Services" > "Library"
   - Search for and enable:
     - **Maps JavaScript API**
     - **Places API**

4. **Create API Key credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
   - (Optional) Restrict the key to web applications and specific domains for security

5. **Add restrictions** (recommended for production):
   - Set "Application restrictions" to "HTTP referrers (web sites)"
   - Add your domain(s): 
     - For local development: `localhost:3000`
     - For Vercel: `*.vercel.app`

## Configuration

### Local Development

1. Create a `.env.local` file in the `frontend` directory:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

2. Replace `your_api_key_here` with your actual Google Maps API key

3. Restart the development server:
```bash
npm run dev
```

### Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the following variable:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Your Google Maps API key
4. Deploy/redeploy your application

## Features Using Google Maps

### 1. **Location Picker** (Create Event & Profile)
- Search for locations with autocomplete
- Get precise coordinates (latitude/longitude)
- Integrated into event creation and user profile setup

### 2. **Event Map Display** (Discover Page)
- View all nearby events on an interactive map
- Click markers to see event details
- Dark-themed map that matches the app aesthetic
- Responsive design for mobile and web

### 3. **Map Integration**
- Events with coordinates show on the discover page map
- User location data stored for future "find nearby" features

## Troubleshooting

### "Google Maps API key not configured"
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in your environment
- Verify the key is correct and not expired
- Ensure the Maps JavaScript API and Places API are enabled in Google Cloud Console

### Map not showing/Loading slowly
- Check browser console for errors
- Verify API key has the correct permissions
- Check that your domain is whitelisted (if restrictions are set)
- Ensure your quota hasn't been exceeded in Google Cloud Console

### Places autocomplete not working
- Verify "Places API" is enabled in Google Cloud Console
- Check that your API key has access to the Places API
- Look for errors in the browser console

## API Usage and Costs

Google Maps APIs have free tier quotas, but charges may apply if you exceed:
- **Maps JavaScript API**: 25,000 map loads per day free
- **Places API**: 100,000 requests per month free

Monitor your usage in Google Cloud Console > Billing to avoid unexpected charges.

## Security Notes

- Never commit your API key to version control
- Always use environment variables for API keys
- Use API key restrictions (HTTP referrers, IP restrictions) in production
- Monitor your API usage regularly for unauthorized access
