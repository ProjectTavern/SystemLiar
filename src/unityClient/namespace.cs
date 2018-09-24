using UnityEngine;
using socket.io;

namespace Sample {

    public class Namespace : MonoBehaviour {

        void Start() {
            var serverUrl = "http://qoov.iptime.org";
            var chat = Socket.Connect(serverUrl + "/roomspace");
        }
    }
}
