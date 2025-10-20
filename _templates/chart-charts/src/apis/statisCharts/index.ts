import { http } from "/@/utils/axios";
import { StatisDevice } from "./type";

export async function statisDeviceByUserObject() {
  const { data } = await http.request<StatisDevice[]>({
    url: "/api/device/home/statisDeviceByUserObject",
    method: "get"
  });
  console.log(data, "data---");
  return data;
}
