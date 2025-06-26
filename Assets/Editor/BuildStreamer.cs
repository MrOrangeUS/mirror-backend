using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using System.IO;

public class BuildStreamer : IPreprocessBuildWithReport
{
    public int callbackOrder => 0;
    public void OnPreprocessBuild(BuildReport report)
    {
        string src = "Assets/StreamingAssets/ffmpeg.exe";
        string dst = Path.Combine(report.summary.outputPath, "StreamingAssets", "ffmpeg.exe");
        Directory.CreateDirectory(Path.GetDirectoryName(dst));
        File.Copy(src, dst, true);
    }
} 