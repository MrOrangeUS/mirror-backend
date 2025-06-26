using UnityEngine;
using NativeWebSocket;
using TMPro;
using System.Collections;
using System;

public class NativeWebSocketClient : MonoBehaviour
{
    public string wsUrl = "ws://localhost:8765";
    public AudioSource audioSource;
    public TextMeshProUGUI responseText;

    private WebSocket websocket;

    async void Start()
    {
        websocket = new WebSocket(wsUrl);
        websocket.OnOpen += () => Debug.Log("WebSocket opened!");
        websocket.OnError += (e) => Debug.LogError($"WebSocket error: {e}");
        websocket.OnClose += (e) => Debug.Log("WebSocket closed");
        websocket.OnMessage += (bytes) =>
        {
            string json = System.Text.Encoding.UTF8.GetString(bytes);
            Debug.Log($"WS Message: {json}");
            try
            {
                var msg = JsonUtility.FromJson<Message>(json);
                if (msg.type == "audio")
                    StartCoroutine(PlayAudio(msg.path));
                else if (msg.type == "text" && responseText != null)
                    responseText.text = msg.text;
            }
            catch (Exception ex)
            {
                Debug.LogError($"WS parse error: {ex}");
            }
        };
        await websocket.Connect();
    }

    IEnumerator PlayAudio(string filePath)
    {
        string uri = filePath.StartsWith("http") ? filePath : "file:///" + filePath;
        using (var www = UnityEngine.Networking.UnityWebRequestMultimedia.GetAudioClip(uri, AudioType.MPEG))
        {
            yield return www.SendWebRequest();
            if (www.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                var clip = UnityEngine.Networking.DownloadHandlerAudioClip.GetContent(www);
                audioSource.clip = clip;
                audioSource.Play();
            }
            else
            {
                Debug.LogError("Audio load failed: " + www.error);
            }
        }
    }

    private void Update()
    {
        #if !UNITY_WEBGL || UNITY_EDITOR
        websocket?.DispatchMessageQueue();
        #endif
    }

    private async void OnDestroy()
    {
        if (websocket != null)
            await websocket.Close();
    }

    [Serializable]
    public class Message
    {
        public string type;
        public string path;
        public string text;
    }
} 