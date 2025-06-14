# Google Speech API Integration

## Audio Configuration

### Encoding and Sample Rate
- The audio encoding must match the actual format of the audio data
- For WEBM OPUS audio (commonly used in web browsers):
  ```typescript
  encoding: speechProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
  sampleRateHertz: 48000
  ```
- For LINEAR16 audio:
  ```typescript
  encoding: speechProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
  sampleRateHertz: 16000
  ```

### Common Issues
1. **Sample Rate Mismatch**
   - Error: `sample_rate_hertz in RecognitionConfig must either be unspecified or match the value in the audio header`
   - Solution: Ensure the sample rate matches the actual audio format
   - For WEBM OPUS from browsers, use 48000 Hz
   - For LINEAR16, typically use 16000 Hz

2. **Encoding Mismatch**
   - Error: `Invalid audio encoding`
   - Solution: Match the encoding to the actual audio format
   - Common formats:
     - `WEBM_OPUS`: Used by most modern browsers
     - `LINEAR16`: Raw PCM audio
     - `FLAC`: Compressed lossless audio

## Configuration Types

When working with the Google Speech API, there are two different types of boolean fields in the `RecognitionConfig`:

1. **Regular Boolean Fields**
   - These are simple boolean values
   - Examples:
     ```typescript
     enableAutomaticPunctuation: true,
     useEnhanced: true,
     enableWordTimeOffsets: true
     ```

2. **BoolValue Fields**
   - These are wrapped in a `google.protobuf.BoolValue` object
   - Must be specified as `{ value: boolean }`
   - Examples:
     ```typescript
     enableSpokenPunctuation: { value: true },
     enableSpokenEmojis: { value: true }
     ```

## Type Definitions

The API types are imported from `@google-cloud/speech`:
```typescript
import { protos as speechProtos } from '@google-cloud/speech';
```

Key types:
- `speechProtos.google.cloud.speech.v1.IRecognizeRequest` - The main request type
- `speechProtos.google.protobuf.BoolValue` - The wrapper type for boolean values

## Common Gotchas

1. **Boolean Field Access**
   - When logging or accessing config values, remember that regular boolean fields are accessed directly
   - BoolValue fields must be accessed with `.value`
   ```typescript
   // Correct way to access fields
   const config = {
     ...request.config,
     // Regular booleans
     enableAutomaticPunctuation: request.config?.enableAutomaticPunctuation,
     useEnhanced: request.config?.useEnhanced,
     // BoolValue fields
     enableSpokenPunctuation: request.config?.enableSpokenPunctuation?.value,
     enableSpokenEmojis: request.config?.enableSpokenEmojis?.value
   };
   ```

2. **Type Assertions**
   - When setting BoolValue fields, you may need to use type assertions:
   ```typescript
   enableSpokenPunctuation: { value: true } as speechProtos.google.protobuf.BoolValue
   ```

## Best Practices

1. **Type Safety**
   - Always use the proper types from `@google-cloud/speech`
   - Avoid using generic boolean types for BoolValue fields

2. **Logging**
   - When logging configuration, ensure you're accessing the correct property type
   - Use optional chaining (`?.`) to safely access nested properties

3. **Error Handling**
   - Always validate the response from the API
   - Check for the presence of results before accessing them
   ```typescript
   if (!response.results || response.results.length === 0) {
     throw new Error('No transcription results found in response');
   }
   ```

## Resources

- [Google Cloud Speech-to-Text API Documentation](https://cloud.google.com/speech-to-text/docs)
- [Protocol Buffers Documentation](https://developers.google.com/protocol-buffers) 