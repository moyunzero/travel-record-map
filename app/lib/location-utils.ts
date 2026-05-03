/**
 * 地点相关的工具函数
 */

/**
 * 从完整地址中提取简短的地点名称（第一部分）
 * @param fullName 完整的地址字符串
 * @returns 提取的简短名称
 * @example
 * extractShortLocationName("北京市, 中国") // "北京市"
 * extractShortLocationName("Eiffel Tower, Paris, France") // "Eiffel Tower"
 */
export function extractShortLocationName(fullName?: string): string {
  if (!fullName)
    return "";
  return fullName.split(",")[0]?.trim() ?? "";
}

/**
 * 格式化坐标数字为固定精度
 * @param value 坐标值
 * @param precision 精度（小数位数），默认为 5
 * @returns 格式化后的数字
 */
export function formatCoordinate(value?: number, precision = 5): number {
  if (value === undefined || value === null)
    return 0;
  return Number(value.toFixed(precision));
}
