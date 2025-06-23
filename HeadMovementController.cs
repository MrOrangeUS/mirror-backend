using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class HeadMovementController : MonoBehaviour
{
    [Header("Audio & Head")]
    [Tooltip("AudioSource used for TTS playback.")]
    public AudioSource audioSource;

    [Tooltip("Transform of the head bone or head GameObject.")]
    public Transform headTransform;

    [Header("Nod Settings")]
    [Tooltip("Multiplier for audio sensitivity.")]
    public float sensitivity = 5f;
    [Tooltip("Maximum tilt angle in degrees.")]
    public float maxTiltAngle = 10f;
    [Tooltip("Smooth time for interpolation.")]
    public float smoothTime = 0.1f;

    private float currentAngle  = 0f;
    private float angleVelocity = 0f;

    void Reset()
    {
        audioSource   = GetComponent<AudioSource>();
        headTransform = transform;
    }

    void Update()
    {
        if (audioSource.isPlaying)
        {
            // grab audio output samples
            float[] samples = new float[256];
            audioSource.GetOutputData(samples, 0);
            // compute RMS amplitude
            float sum = 0f;
            foreach (var s in samples) sum += s * s;
            float rms = Mathf.Sqrt(sum / samples.Length);
            // map to tilt angle
            float targetAngle = Mathf.Clamp(rms * sensitivity * maxTiltAngle, -maxTiltAngle, maxTiltAngle);
            // smooth interpolation
            currentAngle = Mathf.SmoothDamp(currentAngle, targetAngle, ref angleVelocity, smoothTime);
            // apply rotation on X axis
            headTransform.localRotation = Quaternion.Euler(currentAngle, 0f, 0f);
        }
        else
        {
            // ease back to neutral
            currentAngle = Mathf.SmoothDamp(currentAngle, 0f, ref angleVelocity, smoothTime);
            headTransform.localRotation = Quaternion.Euler(currentAngle, 0f, 0f);
        }
    }
} 