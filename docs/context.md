# Project Context

This document provides context about the Danish Buddy project, its goals, and technical considerations.

## Overview

Danish Buddy is a language learning application that helps users practice Danish through speech recognition and conversation. The application uses modern web technologies to provide an interactive and engaging learning experience.

## Technical Stack

- **Frontend**: Next.js with TypeScript
- **Speech Recognition**: Google Cloud Speech-to-Text API
- **Audio Processing**: Web Audio API and MediaRecorder API
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Key Features

### Speech Recognition

The application uses the Google Cloud Speech-to-Text API for accurate Danish speech recognition. Key considerations:

- **Audio Quality**: High-quality audio recording is essential for accurate speech recognition
- **Real-time Processing**: Audio is processed and sent to the API in real-time
- **Error Handling**: Comprehensive error handling for various scenarios
- **User Feedback**: Clear feedback about recording status and errors

### Microphone Access

Microphone access is a critical component of the application. Key considerations:

- **Browser Compatibility**: Support for major modern browsers
- **Permission Handling**: Clear permission requests and error messages
- **Resource Management**: Proper cleanup of audio resources
- **Error Recovery**: Graceful handling of common issues

## User Experience Goals

1. **Intuitive Interface**
   - Clear recording controls
   - Visual feedback during recording
   - Helpful error messages

2. **Reliable Performance**
   - Consistent audio recording
   - Accurate speech recognition
   - Smooth error recovery

3. **Accessibility**
   - Clear error messages
   - Keyboard navigation
   - Screen reader support

## Technical Challenges

### Microphone Access

1. **Browser Differences**
   - Different browsers handle microphone access differently
   - Permission models vary
   - API support varies

2. **Device Compatibility**
   - Different microphone types
   - Various audio configurations
   - Hardware limitations

3. **Error Scenarios**
   - Permission denied
   - Device not found
   - Device in use
   - Hardware issues

### Audio Processing

1. **Quality Requirements**
   - High-quality audio for accurate recognition
   - Efficient processing for real-time feedback
   - Balance of quality and performance

2. **Resource Management**
   - Memory usage
   - CPU usage
   - Battery impact

3. **Error Handling**
   - Network issues
   - API limitations
   - Processing errors

## Future Considerations

1. **Browser Support**
   - Monitor browser compatibility
   - Track API changes
   - Plan for new features

2. **Performance**
   - Optimize audio processing
   - Reduce resource usage
   - Improve error recovery

3. **User Experience**
   - Gather user feedback
   - Monitor common issues
   - Plan improvements

4. **Security**
   - Monitor best practices
   - Update security measures
   - Handle new threats

## Danish Buddy Chat and Audio Experience

- After each assistant (bot) message, the Danish response is automatically spoken aloud to the user.
- The English translation is only displayed as text on the screen and is never spoken.
- Each assistant message includes a Play button, which allows the user to replay only the Danish audio for that message.
- If the user enables mute, auto-play is disabled, but the Play button remains available for manual playback.

### Rationale
- This design supports immersive language learning by encouraging users to listen and respond in Danish.
- The clear separation between spoken Danish and written English helps reinforce comprehension and translation skills.
- Manual replay via the Play button supports repeated listening and pronunciation practice. 