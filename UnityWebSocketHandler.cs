using UnityEngine;
using WebSocketSharp;
using System;
using System.Collections;

[Serializable]
public class Message
{
    public string type;
    public string path;
}

public class UnityWebSocketHandler : MonoBehaviour
{
    [Header("WebSocket Settings")]
    private readonly string wsUrl = "ws://localhost:8765";
    private WebSocket webSocket;

    [Header("Audio")]
    public AudioSource audioSource;

    void Start()
    {
        if (!audioSource)
        {
            Debug.LogError("Assign AudioSource in Inspector!");
            return;
        }

        webSocket = new WebSocket(wsUrl);
        webSocket.OnMessage += (sender, e) => OnWsMessage(e.Data);
        webSocket.OnError   += (sender, e) => Debug.LogError("WS Error: " + e.Message);
        webSocket.OnClose   += (sender, e) => Debug.Log("WS Closed");
        webSocket.Connect();
        Debug.Log("WS connected to " + wsUrl);
    }

    void OnWsMessage(string json)
    {
        try
        {
            var msg = JsonUtility.FromJson<Message>(json);
            if (msg.type == "audio")
            {
                StartCoroutine(LoadAndPlayAudio(msg.path));
            }
        }
        catch (Exception ex)
        {
            Debug.LogError("WS parse error: " + ex);
        }
    }

    IEnumerator LoadAndPlayAudio(string filePath)
    {
        string uri = "file:///" + filePath;
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

    private void OnDestroy()
    {
        if (webSocket != null && webSocket.ReadyState == WebSocketState.Open)
            webSocket.Close();
    }
}