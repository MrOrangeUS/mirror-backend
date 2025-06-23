using UnityEngine;
using TMPro;
using WebSocketSharp;
using System;
using System.Collections;

[Serializable]
public class Message
{
    public string type;
    public string comment;
    public string text;
    public string path;
}

public class UnityWebSocketHandler : MonoBehaviour
{
    [Header("WebSocket Settings")]
    private readonly string wsUrl = "ws://localhost:8765";
    private WebSocket ws;

    [Header("UI References")]
    public TextMeshProUGUI chatText;
    public TextMeshProUGUI responseText;

    [Header("Audio")]
    public AudioSource audioSource;

    void Start()
    {
        if (!chatText || !responseText || !audioSource)
        {
            Debug.LogError("Assign ChatText, ResponseText & AudioSource in Inspector!");
            return;
        }

        ws = new WebSocket(wsUrl);
        ws.OnMessage += (sender, e) => OnWsMessage(e.Data);
        ws.OnError   += (sender, e) => Debug.LogError("WS Error: " + e.Message);
        ws.OnClose   += (sender, e) => Debug.Log("WS Closed");
        ws.Connect();
        Debug.Log("WS connected to " + wsUrl);
    }

    void OnWsMessage(string json)
    {
        try
        {
            var msg = JsonUtility.FromJson<Message>(json);
            switch (msg.type)
            {
                case "chat":
                    chatText.text = msg.comment;
                    break;
                case "response":
                    responseText.text = msg.text;
                    break;
                case "audio":
                    StartCoroutine(LoadAndPlayAudio(msg.path));
                    break;
                default:
                    Debug.LogWarning("Unknown WS msg: " + msg.type);
                    break;
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

    void OnDestroy()
    {
        if (ws != null && ws.ReadyState == WebSocketState.Open)
            ws.Close();
    }
} 