using UnityEngine;
using System.Diagnostics;
using System.IO;
using System;
using System.Text;
using System.Threading;
using System.Collections;

public class RtmpStreamer : MonoBehaviour
{
    public Camera captureCamera;
    public RenderTexture renderTexture;
    public AudioSource audioSource;
    private Process ffmpeg;
    private Stream ffmpegVideoIn;
    private Stream ffmpegAudioIn;
    private Thread videoThread;
    private Thread audioThread;
    private bool running = false;
    private int width, height;
    private string ffmpegPath, rtmpUrl, rtmpKey;

    void Start()
    {
        LoadEnv();
        ffmpegPath = Path.Combine(Application.streamingAssetsPath, "ffmpeg.exe");
        width = renderTexture.width;
        height = renderTexture.height;
        StartFFmpeg();
        running = true;
        videoThread = new Thread(VideoLoop) { IsBackground = true };
        videoThread.Start();
        audioThread = new Thread(AudioLoop) { IsBackground = true };
        audioThread.Start();
    }

    void LoadEnv()
    {
        string envPath = Path.Combine(Directory.GetCurrentDirectory(), "stream.env");
        foreach (var line in File.ReadAllLines(envPath))
        {
            if (line.StartsWith("TIKTOK_RTMP_URL="))
                rtmpUrl = line.Substring("TIKTOK_RTMP_URL=".Length).Trim();
            if (line.StartsWith("TIKTOK_STREAM_KEY="))
                rtmpKey = line.Substring("TIKTOK_STREAM_KEY=".Length).Trim();
        }
    }

    void StartFFmpeg()
    {
        var psi = new ProcessStartInfo
        {
            FileName = ffmpegPath,
            Arguments = $"-y -f rawvideo -pix_fmt rgba -s {width}x{height} -r 30 -i pipe:0 " +
                        "-f f32le -ar 48000 -ac 2 -i pipe:1 " +
                        "-c:v libx264 -pix_fmt yuv420p -preset veryfast -b:v 2500k " +
                        "-c:a aac -b:a 160k " +
                        $"-f flv \"{rtmpUrl}/{rtmpKey}\"",
            UseShellExecute = false,
            RedirectStandardInput = true,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            CreateNoWindow = true
        };
        ffmpeg = Process.Start(psi);
        ffmpegVideoIn = ffmpeg.StandardInput.BaseStream;
        ffmpegAudioIn = ffmpeg.StandardInput.BaseStream; // For pipe:1, use named pipes or a workaround if needed
        Directory.CreateDirectory("Logs");
        File.WriteAllText("Logs/stream.log", "");
        ffmpeg.ErrorDataReceived += (s, e) => { if (e.Data != null) File.AppendAllText("Logs/stream.log", e.Data + "\n"); };
        ffmpeg.BeginErrorReadLine();
    }

    void VideoLoop()
    {
        var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
        while (running)
        {
            RenderTexture.active = renderTexture;
            tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            tex.Apply();
            byte[] bytes = tex.GetRawTextureData();
            ffmpegVideoIn.Write(bytes, 0, bytes.Length);
            ffmpegVideoIn.Flush();
            Thread.Sleep(33); // ~30fps
        }
    }

    void AudioLoop()
    {
        float[] samples = new float[1024 * 2];
        while (running)
        {
            audioSource.GetOutputData(samples, 0);
            byte[] bytes = new byte[samples.Length * 4];
            Buffer.BlockCopy(samples, 0, bytes, 0, bytes.Length);
            ffmpegAudioIn.Write(bytes, 0, bytes.Length);
            ffmpegAudioIn.Flush();
            Thread.Sleep(21); // ~48kHz/1024
        }
    }

    void OnApplicationQuit()
    {
        running = false;
        ffmpegVideoIn?.Close();
        ffmpegAudioIn?.Close();
        if (ffmpeg != null && !ffmpeg.HasExited)
        {
            ffmpeg.StandardInput.Close();
            ffmpeg.WaitForExit(2000);
            ffmpeg.Kill();
        }
    }
} 