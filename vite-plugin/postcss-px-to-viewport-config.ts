/**
 * https://github.com/evrone/postcss-px-to-viewport
 */
import pxToViewport from 'postcss-px-to-viewport';

export function postcssPxToViewportConfig(params) {
    const {
        unitToConvert = 'px',
        viewportWidth = 750,
        unitPrecision = 6,
        propList = ['*'],
        viewportUnit = 'vw',
        fontViewportUnit = 'vw',
        selectorBlackList = ['keep-px'],
        minPixelValue = 1,
        mediaQuery = true,
        replace = true,
        landscape = false,
        exclude = [/node_modules/],
    } = params || {};
    return pxToViewport({
        unitToConvert, // 要转化的单位
        viewportWidth, // UI设计稿的宽度
        unitPrecision, // 转换后的精度，即小数点位数
        propList, // 指定转换的css属性的单位，*表明所有css属性的单位都进行转换
        viewportUnit, // 指定须要转换成的视窗单位，默认vw
        fontViewportUnit, // 指定字体须要转换成的视窗单位，默认vw
        selectorBlackList, // 指定不转换为视窗单位的类名 (正则匹配)
        minPixelValue, // 默认值1，小于或等于1px则不进行转换
        mediaQuery, // 是否在媒体查询的css代码中也进行转换，默认false
        replace, // 是否转换后直接更换属性值
        exclude, // 设置忽略文件，用正则作目录名匹配
        landscape, // 是否处理横屏状况
    });
};

/**
 *  unitToConvert: 'px', // 需要转换的单位，默认为"px"
    viewportWidth: 750, // 设计稿的视口宽度
    unitPrecision: 5, // 单位转换后保留的精度
    propList: ['*','!font-size', '!font*'], // 能转化为vw的属性列表,!font-size(!font*)表示font-size后面的单位不会被转换
    viewportUnit: 'vw', // 希望使用的视口单位
    fontViewportUnit: 'vw', // 字体使用的视口单位
    // 需要忽略的CSS选择器，不会转为视口单位，使用原有的px等单位。
    // 下面配置表示类名中含有'keep-px'都不会被转换
    selectorBlackList: ['keep-px'],
    minPixelValue: 1, // 设置最小的转换数值，如果为1的话，只有大于1的值会被转换
    mediaQuery: false, // 媒体查询里的单位是否需要转换单位
    replace: true, //  是否直接更换属性值，而不添加备用属性
    exclude: [/node_modules/], // 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
    include: [/src/], // 如果设置了include，那将只有匹配到的文件才会被转换
    landscape: false, // 是否添加根据 landscapeWidth 生成的媒体查询条件 @media (orientation: landscape)
    landscapeUnit: 'vw', // 横屏时使用的单位
    landscapeWidth: 1338, // 横屏时使用的视口宽度
 */
