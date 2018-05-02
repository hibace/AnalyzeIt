using FaceIt.Models;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Web;
using System.Windows.Media.Imaging;

namespace FaceIt.ServiceHelpers
{
    internal static class UIHelper
    {
        public static IEnumerable<AIFace> CalculateFaceRectangleForRendering(IEnumerable<Microsoft.ProjectOxford.Face.Contract.Face> faces, int maxSize, Tuple<int, int> imageInfo)
        {
            var imageWidth = imageInfo.Item1;
            var imageHeight = imageInfo.Item2;
            float ratio = (float)imageWidth / imageHeight;

            int uiWidth = 0;
            int uiHeight = 0;

            uiWidth = maxSize;
            uiHeight = (int)(maxSize / ratio);

            float scale = (float)uiWidth / imageWidth;

            foreach (var face in faces)
            {
                yield return new AIFace()
                {
                    FaceId = face.FaceId.ToString(),
                    Left = (int)(face.FaceRectangle.Left * scale),
                    Top = (int)(face.FaceRectangle.Top * scale),
                    Height = (int)(face.FaceRectangle.Height * scale),
                    Width = (int)(face.FaceRectangle.Width * scale),
                };
            }
        }
        
        public static Tuple<int, int> GetImageInfoForRendering(string imageFilePath)
        {
            try
            {
                using (var s = File.OpenRead(imageFilePath)) 
                {
                    JpegBitmapDecoder decoder = new JpegBitmapDecoder(s, BitmapCreateOptions.None, BitmapCacheOption.None);
                    var frame = decoder.Frames.First();
                    
                    return new Tuple<int, int>(frame.PixelWidth, frame.PixelHeight);
                }
            }
            catch (Exception ex)
            {
                var s = ex.ToString();
                return new Tuple<int, int>(0, 0);
            }
        }
    }
}