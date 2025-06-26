using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class HeadMovementController : MonoBehaviour
{
    public AudioSource audioSource;
    public Transform headTransform;
    public float sensitivity = 5f;
    public float maxTiltAngle = 10f;
    public float smoothTime = 0.1f;

    float currentAngle = 0f;
    float angleVelocity = 0f;

    void Reset()
    {
        audioSource = GetComponent<AudioSource>();
        headTransform = transform;
    }

    void Update()
    {
        if (audioSource && audioSource.isPlaying)
        {
            float[] samples = new float[256];
            audioSource.GetOutputData(samples, 0);
            float sum = 0f;
            foreach (var s in samples) sum += s * s;
            float rms = Mathf.Sqrt(sum / samples.Length);
            float target = Mathf.Clamp(rms * sensitivity * maxTiltAngle, -maxTiltAngle, maxTiltAngle);
            currentAngle = Mathf.SmoothDamp(currentAngle, target, ref angleVelocity, smoothTime);
        }
        else
        {
            currentAngle = Mathf.SmoothDamp(currentAngle, 0f, ref angleVelocity, smoothTime);
        }
        if (headTransform)
            headTransform.localRotation = Quaternion.Euler(currentAngle, 0f, 0f);
    }
}
