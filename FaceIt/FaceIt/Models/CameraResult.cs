using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FaceIt.Models
{
    public class CameraResult
    {
        public Microsoft.ProjectOxford.Face.Contract.Face[] Faces { get; set; } = null;
        public Microsoft.ProjectOxford.Common.Contract.EmotionScores[] EmotionScores { get; set; } = null;
    }
}