import { MockMethod } from "vite-plugin-mock";

const data = [
  {
    name: "1",
    qty: 372,
    deptId: null,
    target: null
  },
  {
    name: "2",
    qty: 180,
    deptId: null,
    target: null
  },
  {
    name: "3",
    qty: 292,
    deptId: null,
    target: null
  },
  {
    name: "4",
    qty: 201,
    deptId: null,
    target: null
  },
  {
    name: "5",
    qty: 190,
    deptId: null,
    target: null
  },
  {
    name: "6",
    qty: 98,
    deptId: null,
    target: null
  }
];
export default [
  {
    url: "/api/device/home/statisDeviceByUserObject",
    method: "get",
    response: ({ query }) => {
      return {
        code: 10000,
        data,
        message: "成功!",
        timestamp: 1669260380099
      };
    }
  }
] as MockMethod[];
