using UnityEngine;
using SocketIOClient;
using System.Threading.Tasks;

public class AudioSocketClient : MonoBehaviour
{
    public string serverUrl = "http://localhost:5000";
    public AudioSource audioSource;

    private SocketIO client;

    async void Start()
    {
        client = new SocketIO(serverUrl);
        client.OnConnected += (s, e) => Debug.Log("SocketIO Connected");
        client.On("chat", response => {
            var data = response.GetValue<ChatData>();
            Debug.Log($"Chat: {data.user}: {data.text}");
        });
        client.On("response", response => {
            var data = response.GetValue<ResponseData>();
            Debug.Log($"Reply: {data.text}");
        });
        client.On("audio", async response => {
            var data = response.GetValue<AudioData>();
            await PlayAudio(data.path);
        });
        await client.ConnectAsync();
    }

    async Task PlayAudio(string path)
    {
        string uri = path.StartsWith("http") ? path : "file:///" + path;
        using var req = UnityEngine.Networking.UnityWebRequestMultimedia.GetAudioClip(uri, AudioType.MPEG);
        await req.SendWebRequest();
        if (req.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
        {
            var clip = UnityEngine.Networking.DownloadHandlerAudioClip.GetContent(req);
            audioSource.clip = clip;
            audioSource.Play();
        }
    }

    [System.Serializable]
    public class ChatData { public string platform, user, text; }
    [System.Serializable]
    public class ResponseData { public string text; }
    [System.Serializable]
    public class AudioData { public string path; }
} 