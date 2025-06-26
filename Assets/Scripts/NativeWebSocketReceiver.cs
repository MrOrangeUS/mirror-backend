using UnityEngine;
using NativeWebSocket;
using System;
using System.Collections;

[Serializable]
public class WsMessage
{
    public string type;
    public string user;
    public string text;
    public string path;
    public string gift;
    public int amount;
}

[RequireComponent(typeof(AudioSource))]
public class NativeWebSocketReceiver : MonoBehaviour
{
    public string wsUrl = "ws://localhost:8765";
    private WebSocket websocket;
    private AudioSource audioSource;

    void Awake()
    {
        audioSource = GetComponent<AudioSource>();
    }

    async void Start()
    {
        websocket = new WebSocket(wsUrl);
        websocket.OnMessage += OnWsMessage;
        await websocket.Connect();
    }

    private void OnWsMessage(byte[] bytes)
    {
        string json = System.Text.Encoding.UTF8.GetString(bytes);
        var msg = JsonUtility.FromJson<WsMessage>(json);
        switch (msg.type)
        {
            case "audio":
                StartCoroutine(PlayAudio(msg.path));
                break;
            default:
                Debug.Log($"WS {msg.type}: {json}");
                break;
        }
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
}
