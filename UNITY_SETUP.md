# Unity Setup Guide

## Prerequisites

- Unity 2022.3 LTS or newer
- WebSocketSharp package (install via Package Manager)
- TextMeshPro package (should be included with Unity)

## Installation Steps

### 1. Import Scripts
Copy the following files to your Unity project's `Assets/Scripts/` folder:
- `UnityWebSocketHandler.cs`
- `HeadMovementController.cs`

### 2. Install WebSocketSharp
1. Open Unity Package Manager (Window → Package Manager)
2. Click the "+" button → "Add package from git URL"
3. Enter: `com.unity.websocket-sharp`
4. Click "Add"

### 3. Scene Setup

#### Delete Default Objects
- Remove the default Cube from your scene

#### Import 3D Model
1. Import your 3D avatar model into `Assets/Models/`
2. Drag the model prefab into your scene
3. Ensure it has a proper hierarchy with a head bone/transform

#### Add Components to Avatar
1. Select your avatar root GameObject
2. Add an **AudioSource** component
3. Add the **UnityWebSocketHandler** component
4. Add the **HeadMovementController** component

#### Configure Inspector Settings

**UnityWebSocketHandler:**
- Assign your `chatText` (TextMeshProUGUI)
- Assign your `responseText` (TextMeshProUGUI) 
- Assign the `audioSource` (AudioSource component)

**HeadMovementController:**
- Assign the `audioSource` (AudioSource component)
- Assign the `headTransform` (your avatar's head bone/transform)
- Adjust sensitivity, maxTiltAngle, and smoothTime as needed

### 4. Create UI Elements
1. Create a Canvas (UI → Canvas)
2. Add two TextMeshPro - Text (UI) elements:
   - One for chat messages
   - One for AI responses
3. Assign these to the respective fields in UnityWebSocketHandler

### 5. Test Setup
1. Ensure your backend server is running on `ws://localhost:8765`
2. Press Play in Unity
3. Verify:
   - WebSocket connection status in Console
   - Chat text updates when messages arrive
   - Response text displays AI replies
   - Audio plays when TTS files are received
   - Head nods in response to audio amplitude

## Troubleshooting

**WebSocket Connection Failed:**
- Check that your backend server is running
- Verify the WebSocket URL in UnityWebSocketHandler.cs
- Check firewall settings

**Audio Not Playing:**
- Ensure AudioSource is properly assigned
- Check that audio files exist at the specified paths
- Verify audio file format is supported (MPEG)

**Head Not Moving:**
- Confirm headTransform is assigned to the correct bone
- Check that AudioSource is playing
- Adjust sensitivity and maxTiltAngle values

**Script Errors:**
- Ensure WebSocketSharp package is installed
- Check that TextMeshPro is imported
- Verify all required components are assigned in Inspector

## Performance Notes

- The head movement uses 256 audio samples per frame
- Adjust sensitivity and smoothTime for optimal performance
- Consider reducing update frequency for lower-end devices 