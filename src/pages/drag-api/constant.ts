
export interface ICourseData {
    id: string;
    name: string;
    bgColor: string;
}

const colors = [
    '#e6194B',
    '#f58231',
    '#ffe119',
    '#3cb44b',
    '#42d4f4',
    '#4363d8',
    '#911eb4',
    '#fabed4',
    '#9A6324',
    '#00FF40',
    '#aaffc3',
    '#dcbeff',
];
// 火焰红 #FF0000
// 电光橙 #FF8000
// 柠檬黄 #FFFF00
// 荧光绿 #80FF00
// 霓虹青 #00FF80
// 宝石蓝 #0080FF
// 皇家紫 #8000FF
// 品红 #FF00FF
// 珊瑚粉 #FF4081
// 蜜瓜橙 #FFAB40
// 芥末黄 #FFD700
// 翡翠绿 #00FF40
// 孔雀蓝 #00FFFF
// 钴蓝 #0040FF
// 薰衣草紫 #AA00FF
// 玫瑰红 #FF0066
// 日落橙 #FF6600
// 香蕉黄 #FFE600
// 酸橙绿 #CCFF00
// 碧波蓝 #00BFFF

export const CourseData: ICourseData[] = [
    {
        id: 'Chinese',
        name: '语文',
        bgColor: '#fff',
    },
    {
        id: 'Mathematics',
        name: '数学',
        bgColor: '#fff',
    },
    {
        id: 'English',
        name: '英语',
        bgColor: '#fff',
    },
    {
        id: 'Physics',
        name: '物理',
        bgColor: '#fff',
    },
    {
        id: 'Chemistry',
        name: '化学',
        bgColor: '#fff',
    },
    {
        id: 'Biology',
        name: '生物',
        bgColor: '#fff',
    },
    {
        id: 'History',
        name: '历史',
        bgColor: '#fff',
    },
    {
        id: 'Geography',
        name: '地理',
        bgColor: '#fff',
    },
    {
        id: 'Politics',
        name: '政治',
        bgColor: '#fff',
    },
    {
        id: 'Art',
        name: '美术',
        bgColor: '#fff',
    },
    {
        id: 'Music',
        name: '音乐',
        bgColor: '#fff',
    },
    {
        id: 'PhysicalEducation',
        name: '体育',
        bgColor: '#fff',
    },
].map((item, index) => ({
    ...item,
    bgColor: colors[index % colors.length],
}));

export type IWeekData = Omit<ICourseData, 'bgColor'>;
export const WeekData: IWeekData[] = [
    {
        id: 'Monday',
        name: '星期一',
    },
    {
        id: 'Tuesday',
        name: '星期二',
    },
    {
        id: 'Wednesday',
        name: '星期三',
    },
    {
        id: 'Thursday',
        name: '星期四',
    },
    {
        id: 'Friday',
        name: '星期五',
    },
    {
        id: 'Saturday',
        name: '星期六',

    },
    {
        id: 'Sunday',
        name: '星期日',
    },
];

