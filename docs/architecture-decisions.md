# Architecture Decisions

This document records the key architectural decisions made in the Danish Buddy project.

## Microphone Access and Audio Recording

### ADR 1: Two-Step Microphone Detection Strategy

**Context**: The application needs reliable microphone access for speech recording. Different browsers and devices handle microphone access differently, and users may have various microphone configurations.

**Decision**: Implement a two-step microphone detection strategy:
1. First attempt direct microphone access using `getUserMedia`
2. Fall back to device enumeration if direct access fails

**Rationale**:
- Direct access is more reliable when permissions are already granted
- Device enumeration provides better error information when access fails
- Two-step approach balances user experience with detailed error reporting

**Consequences**:
- More robust microphone detection
- Better error messages for users
- Slightly more complex code
- Need to handle both success and failure cases

### ADR 2: WebM with Opus Codec for Audio Recording

**Context**: The application needs to record high-quality audio that can be processed by the Google Speech-to-Text API.

**Decision**: Use WebM container format with Opus codec for audio recording.

**Rationale**:
- WebM is widely supported in modern browsers
- Opus codec provides excellent quality at low bitrates
- Compatible with Google Speech-to-Text API
- Good balance of quality and file size

**Consequences**:
- High-quality audio recordings
- Efficient network transfer
- Requires modern browser support
- May need fallback for older browsers

### ADR 3: Audio Processing Configuration

**Context**: Speech recognition quality depends heavily on audio quality and processing.

**Decision**: Use the following audio configuration:
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

**Rationale**:
- Echo cancellation improves clarity in noisy environments
- Noise suppression reduces background noise
- Auto gain control maintains consistent volume
- 48kHz sample rate provides high-quality audio

**Consequences**:
- Better speech recognition accuracy
- Improved user experience
- Higher processing requirements
- May need to handle devices that don't support all features

### ADR 4: Graceful Error Handling for Microphone Access

**Context**: Users may encounter various issues with microphone access, from hardware problems to permission issues.

**Decision**: Implement comprehensive error handling with user-friendly messages and clear troubleshooting steps.

**Rationale**:
- Improves user experience when issues occur
- Reduces support requests
- Helps users resolve common problems
- Makes the application more robust

**Consequences**:
- Better user experience
- More maintainable code
- Clearer error messages
- More complex error handling logic

### ADR 5: Resource Management for Audio Recording

**Context**: Audio recording requires careful management of system resources to prevent memory leaks and ensure proper cleanup.

**Decision**: Implement strict resource management:
- Stop all tracks when recording ends
- Close audio context when component unmounts
- Clear all timeouts and animation frames
- Handle browser tab visibility changes

**Rationale**:
- Prevents memory leaks
- Ensures proper cleanup of system resources
- Improves application stability
- Better user experience

**Consequences**:
- More reliable application
- Better system resource usage
- More complex cleanup logic
- Need to handle edge cases

## Future Considerations

1. **Browser Support**
   - Monitor browser compatibility
   - Consider fallbacks for older browsers
   - Track changes in Web Audio API

2. **Performance Optimization**
   - Monitor audio processing performance
   - Consider optimizations for mobile devices
   - Track memory usage patterns

3. **Security**
   - Monitor security best practices
   - Update permission handling as needed
   - Track changes in browser security policies

4. **User Experience**
   - Gather feedback on error messages
   - Monitor common user issues
   - Consider additional user guidance

## Danish Buddy Chat and Audio Playback Architecture

### Frontend Implementation
- After each new assistant message, the Danish audio (audioUrl) is automatically played using the HTML Audio API, unless the user has muted audio.
- The Play button for each assistant message allows the user to replay only the Danish audio for that message.
- The English translation is displayed as text and is never spoken.
- Conversation history is managed in the frontend and sent with each chat API request to ensure context-aware responses from the AI.
- A ref guard is used to ensure the initial greeting is only sent once, even in React Strict Mode.

### Backend Implementation
- The chat API returns both the Danish response, the English translation, and an audio URL for the Danish part.
- The backend uses the full conversation history to build the OpenAI prompt, ensuring natural, context-aware conversation.

### Edge Cases & Accessibility
- Muting disables auto-play but does not remove the Play button.
- Only the Danish part is ever spoken aloud, supporting focused language immersion. 