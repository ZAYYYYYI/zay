// ---- plugin:plant_disease_detection_1 ----
// ============================================================
// 插件 plant_disease_detection_1 (植物病变检测AI图片理解) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface PlantDiseaseDetectionOneInput {
  /** 用户上传的植物照片 */
  plant_images: string[];
}

/**
 * capabilityClient.load('plant_disease_detection_1').callStream<PlantDiseaseDetectionOneOutput>('imageUnderstanding', input)
 * 每个 chunk 就是下面这个扁平对象，字段名与 PlantDiseaseDetectionOneOutput 一致，外面没有 data / choices / message 包装：
 *   {"content":"示例文本","reasoningContent":"","response":"示例文本"}
 * 返回值可能是 AsyncIterable<chunk>，也可能是 { output: AsyncIterable<chunk> }，取流前先归一化。
 * 逐段累加：
 *   for await (const chunk of stream) { result += chunk.content ?? ''; }
 */
export interface PlantDiseaseDetectionOneOutput {
  /** [object Object] */
  content: string;
  /** [object Object] */
  reasoningContent?: string;
  /** [object Object] */
  response?: string;
}
// ---- end:plant_disease_detection_1 ----