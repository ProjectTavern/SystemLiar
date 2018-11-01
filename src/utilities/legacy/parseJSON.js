/**
 * EmitJson의 사용으로 불필요해짐
 * */
function parseData(data) {
  try {
    data = typeof data === "string" ? JSON.parse(data) : data;
  } catch(e) {
    logger.custLog("[ERROR] Can not parse to JSON from string object.");
  }
  return data;
}
