# Microphone Handling in Danish Buddy

This document outlines how microphone access is handled in the Danish Buddy application and provides troubleshooting steps for common issues.

## Implementation Details

### Microphone Detection Strategy

The application uses a two-step approach to detect and access the microphone:

1. **Direct Access Attempt**
   - First tries to get direct microphone access using `navigator.mediaDevices.getUserMedia`
   - Uses basic audio configuration: `{ audio: true }`
   - If successful, immediately releases the stream to avoid blocking the device

2. **Device Enumeration Fallback**
   - If direct access fails, falls back to enumerating available devices
   - Checks specifically for audio input devices using `device.kind === 'audioinput'`
   - Provides more detailed error messages based on the enumeration results

### Audio Configuration

When recording, the application uses the following audio configuration:

```typescript
{
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
  }
}
```

### Recording Format

- Format: WebM with Opus codec
- MIME Type: `audio/webm;codecs=opus`
- Bitrate: 128 kbps

## Common Issues and Solutions

### "No microphone found" Error

If you see the error "No microphone found. Please connect a microphone and refresh the page":

1. **Check Hardware**
   - Ensure your microphone is properly connected
   - Try unplugging and replugging your microphone
   - Test the microphone in another application (e.g., Windows Voice Recorder)

2. **Check Windows Settings**
   - Open Windows Settings > System > Sound
   - Verify your microphone is listed under "Input"
   - Test the microphone using the "Test your microphone" feature

### "Microphone access denied" Error

If you see the error "Microphone access denied. Please allow microphone access in your browser settings":

1. **Browser Permissions**
   - Click the lock/info icon in your browser's address bar
   - Look for microphone permissions
   - Make sure the site has permission to access your microphone
   - If permission is denied, click "Reset permissions" and try again

2. **Browser Settings**
   - Go to your browser's settings
   - Search for "microphone" or "camera"
   - Make sure microphone access is enabled
   - Check if the site is blocked from accessing the microphone

### "Microphone is busy" Error

If you see the error "Microphone is busy or not working properly":

1. **Close Other Applications**
   - Close any other applications that might be using the microphone
   - This includes video conferencing apps, voice chat, or other browser tabs

2. **Browser Refresh**
   - Close and reopen your browser
   - This will release any held microphone resources

## Debugging

To debug microphone issues:

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Look for the following log messages:
   - "Available devices" - Lists all media devices
   - "Audio input devices" - Lists specifically audio input devices
   - "Microphone access granted" - Shows successful access
   - "Recording stream obtained" - Confirms recording capability

## Best Practices

1. **Always Check Permissions**
   - Check microphone availability on component mount
   - Provide clear feedback about permission status
   - Guide users through permission granting process

2. **Handle Errors Gracefully**
   - Show user-friendly error messages
   - Provide specific troubleshooting steps
   - Disable recording controls when microphone is unavailable

3. **Clean Up Resources**
   - Stop all tracks when recording ends
   - Close audio context when component unmounts
   - Clear all timeouts and animation frames

## Browser Compatibility

The application has been tested with:
- Chrome (recommended)
- Firefox
- Edge
- Safari (with limitations)

Note: Some browsers may require HTTPS for microphone access.

## Security Considerations

1. **Permission Handling**
   - Always request microphone access explicitly
   - Never assume permission is granted
   - Handle permission changes gracefully

2. **Resource Management**
   - Release microphone when not in use
   - Clean up resources properly
   - Handle browser tab visibility changes

## References

- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) 