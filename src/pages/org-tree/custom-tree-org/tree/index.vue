<template>
    <div class="tree-wrap">
        <div 
            class="tree-info-wrap"
            :style="{minWidth: `${treeStyle.minWidth}px`, maxWidth: `${treeStyle.maxWidth}px`}">
            <div v-if="treeData">
                <div class="first-wrap">
                    <span
                        v-if="treeData.pid"
                        class="go-top"
                        @click="goTop(treeData.id)">
                        <icon name="top" />
                    </span>
                    <person
                        :personData="treeData"
                        :show-minus="treeData.isOpen"
                        :show-open-btn="treeData.childFlag"
                        hierarchy="first"
                        :is-active="!treeData.childFlag || activePerson.data?.id === treeData.id"
                        :inner-params="innerParams"
                        @personClick="personClick">
                    </person>
                </div>
                <div 
                    v-if="showSecond" 
                    class="second-wrap"
                    :style="{marginTop: `${treeStyle.connectLineHeight * 2}px`}">
                    <span class="direction-wrap left">
                        <span
                            v-if="secondTree.startIndex !== 0"
                            class="direction"
                            @click="goPage(treeData.children, secondTree.startIndex !== 0, 'previous', 'second')">
                            <icon name="left" />
                        </span>
                    </span>
                    <person 
                        v-for="(item, index) in secondData"
                        :person-data="item"
                        :person-index="index"
                        :key="item ? item.id : index"
                        :is-active="activePerson.data?.id === item.id"
                        :show-minus="item.isOpen"
                        :show-open-btn="item && item.childFlag"
                        :is-last-person="secondLastIndex > initNum - 2 && secondLastIndex === index"
                        hierarchy="second"
                        :has-third="hasThird"
                        :start-index="secondTree.startIndex"
                        :end-index="secondTree.endIndex"
                        :current-index="secondTree.currentIndex"
                        :length="secondData.length"
                        :inner-params="innerParams"
                        @personClick="personClick">
                    </person>
                    <span class="direction-wrap right">
                        <span 
                            v-if="secondTree.endIndex !== treeData.children.length - 1"
                            class="direction"
                            @click="goPage(treeData.children, secondTree.endIndex !== treeData.children.length - 1, 'next', 'second')">
                            <icon name="right" />
                        </span>
                    </span>
                </div>
                <div 
                    v-if="showThird && foldType === 'all'"
                    class="third-wrap"
                    :style="{marginTop: `${treeStyle.connectLineHeight * 2}px`}">
                    <span class="direction-wrap left">
                        <span 
                            v-if="thirdTree.startIndex !== 0 && hasThird"
                            class="direction"
                            @click="goPage(thirdAll, thirdTree.startIndex !== 0, 'previous', 'third')">
                            <icon name="left" />
                        </span>
                    </span>
                    <person 
                        v-for="(item, index) in thirdData"
                        :personData="item"
                        :person-index="index"
                        hierarchy="third"
                        :key="item ? item.id : index"
                        :is-active="item && activePerson.data?.id === item.id"
                        :show-open-btn="item && item.childFlag"
                        :is-last-person="thirdLastIndex === index"
                        :start-index="thirdTree.startIndex"
                        :end-index="thirdTree.endIndex"
                        :current-index="thirdTree.currentIndex"
                        :second-cur="secondTree.currentIndex"
                        :second-start="secondTree.startIndex"
                        :second-end="secondTree.endIndex"
                        :init-num="initNum"
                        :length="thirdData.length"
                        :second-length="secondData.length"
                        :inner-params="innerParams"
                        @personClick="personClick">
                    </person>
                    <span class="direction-wrap right">
                        <span 
                            v-if="thirdTree.endIndex !== thirdAll.length - 1 && hasThird"
                            class="direction"
                            @click="goPage(thirdAll, thirdTree.endIndex !== thirdAll.length - 1, 'next', 'third')">
                            <icon name="right" />
                        </span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" component="Tree">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {cloneDeep, get} from 'lodash-es';
import Person from '../person/index.vue';
import { mitt } from '@/utils/event-mitt';
import { TreeData, TreeStyle, TreeParams } from './type';


interface TreeState {
    currentIndex: number;
    startIndex: number;
    endIndex: number;
}

interface ActivePerson {
    data: TreeData | null;
    inLevel: 'first' | 'second' | 'third';
}

interface PersonClickParams {
    hierarchy: 'first' | 'second' | 'third';
    isOpen: boolean;
    personData: TreeData;
}

interface Props {
    params: TreeParams;
}

// Props
const props = defineProps<Props>();

// State
const treeData = ref<TreeData | null>(null);
const thirdAll = ref<TreeData[]>([]);
const catchThirdData = ref<Record<string, TreeData[]>>({});
const thirdTree = ref<TreeState>({
    currentIndex: 0,
    startIndex: 0,
    endIndex: 0
});
const secondTree = ref<TreeState>({
    currentIndex: 0,
    startIndex: 0,
    endIndex: 0
});
const initNum = ref(0);
const activePerson = ref<ActivePerson>({
    data: null,
    inLevel: 'second'
});
const foldType = ref<'none' | 'second' | 'all'>('all');
const searchId = ref<string>('');
const isRequestThird = ref(false);
const secondId = ref<string>('');
const hasThird = ref(true);
const clientWidth = ref(0);
const timer = ref<number | null>(null);

// Tree style configuration
const treeStyle = ref<TreeStyle>({
    minWidth: 1060,
    maxWidth: 1510,
    cardWidth: 195,
    cardMargin: 10,
    connectLineHeight: 25,
    borderColor: '#CCCCCC',
    highlightColor: '#3999F7',
    highlightShadow: '0 0 8px rgba(57, 153, 247, .7)'
});

// Computed properties
const thirdData = computed(() => {
    if (!(hasThird.value && thirdAll.value.length)) {
        return [];
    }
    let { startIndex, currentIndex, endIndex } = secondTree.value;
    let { startIndex: thirdStartIndex, endIndex: thirdEndIndex } = thirdTree.value;
    let currentSecondIndex = currentIndex - startIndex;
    let pageNum = endIndex - startIndex + 1;
    let data = thirdAll.value.slice(thirdStartIndex, thirdEndIndex + 1);
    let backThird = Array.from({ length: pageNum });
    
    if (data.length < pageNum) {
        if (pageNum - currentSecondIndex < data.length) {
            backThird.splice(pageNum - data.length, data.length);
        }
        backThird.splice(currentSecondIndex, data.length);
        data.forEach(item => {
            backThird.splice(currentSecondIndex, 0, item);
        });
    } else {
        backThird = data;
    }
    return backThird as TreeData[];
});

const secondData = computed(() => {
    let { startIndex, endIndex } = secondTree.value;
    return treeData.value?.children
        ? treeData.value.children.slice(startIndex, endIndex + 1)
        : [];
});

const showSecond = computed(() => {
    let hasChild = treeData.value?.childFlag;
    let isType = foldType.value === 'all' || foldType.value === 'second';
    return hasChild && isType;
});

const showThird = computed(() => {
    let isOpen = secondData.value.length && secondData.value.some(item => item.isOpen);
    let hasData = thirdData.value.length && thirdData.value.some(item => item);
    return hasData && isOpen;
});

const secondLastIndex = computed(() => {
    let newIndex = 0;
    if (secondData.value.length > 1) {
        secondData.value.forEach((item, index) => {
            if (item) {
                newIndex = index;
            }
        });
    }
    return newIndex;
});

const thirdLastIndex = computed(() => {
    let newIndex = 0;
    thirdData.value.forEach((item, index) => {
        if (item) {
            newIndex = index;
        }
    });
    return newIndex;
});

const address = computed(() => {
    const { data, treeType, isSecondRequest, focusId } = props.params;
    return {
        data,
        treeType,
        isSecondRequest,
        focusId
    };
});

const innerParams = computed(() => {
    let { treeType, appendHTML, style } = props.params;
    style = Object.assign({}, treeStyle.value, style);
    return {
        treeType,
        appendHTML,
        style
    };
});

// Methods
const goTop = (id: string | number): void => {
    secondId.value = treeData.value!.id.toString();
    isRequestThird.value = false;
    foldType.value = 'all';
    catchThirdData.value = {};
    innerRequest({
        id: treeData.value!.id
    });
};

const getData = (): void => {
    const data = cloneDeep(props.params.data) as TreeData;
    if (timer.value) {
        clearTimeout(timer.value);
    }
    timer.value = setTimeout(() => {
        handleData(data);
    }, 30);
};

const innerRequest = (params: { type?: string; id: string | number }): void => {
    const { type, id } = params;
    mitt.emit('innerRequest', {
        isSecondRequest: type === 'isSecondRequest',
        id
    });
};

const handleData = (data: TreeData): void => {
    if (!isRequestThird.value) {
        treeData.value = data;
    }
    if (treeData.value?.children?.length) {
        initStatus();
        updateData(data);
    }
};

const initStatus = (): void => {
    if (treeData.value!.childFlag) {
        treeData.value!.isOpen = true;
    }
    treeData.value!.children.forEach((item) => {
        item.isOpen = false;
        if (item.children?.length) {
            if (!searchId.value) {
                searchId.value = item.id.toString();
            }
            item.children.forEach(list => {
                list.isOpen = false;
            });
        }
    });
};

const updateData = (data: TreeData): void => {
    if (!data.children.length) {
        return;
    }
    if (!isRequestThird.value) {
        let currentIndex = 0;
        if (data.id.toString() === searchId.value) {
            setActivePerson({
                data: data,
                hierarchy: 'first'
            });
        } else {
            currentIndex = changePosition(data.children);
            secondTree.value.currentIndex = currentIndex;
            let currPerson = treeData.value!.children[secondTree.value.currentIndex];
            setActivePerson({ data: currPerson, hierarchy: 'second' });
            currPerson.isOpen = true;
            foldType.value = 'all';
            if (currPerson.children) {
                thirdAll.value = currPerson.children;
            }
            if (!catchThirdData.value[currPerson.id]) {
                catchThirdData.value[currPerson.id] = currPerson.children;
            }
        }
        setStartEndIndex(treeData.value!.children, 'second');
    } else {
        thirdAll.value = [];
        hasThird.value = false;
        data.children.forEach(item => {
            if (item.id.toString() === secondId.value && (item.children?.length)) {
                if (!catchThirdData.value[item.id]) {
                    catchThirdData.value[item.id] = item.children;
                }
                thirdAll.value = catchThirdData.value[item.id];
                hasThird.value = true;
            }
        });
        secondData.value.forEach((item) => {
            if (item.id.toString() === secondId.value) {
                item.isOpen = true;
                treeData.value!.children.forEach((list, i) => {
                    if (list.id === item.id) {
                        setActivePerson({ data: list, hierarchy: 'second' });
                        secondTree.value.currentIndex = i;
                    }
                });
            }
        });
    }
    thirdTree.value.currentIndex = parseInt(String(thirdAll.value.length / 2), 10);
    setStartEndIndex(thirdAll.value, 'third');
};

const changePosition = (arr: TreeData[]): number => {
    let currentIndex = 0;
    let centerIndex = parseInt(String(arr.length / 2), 10);
    let remainder = arr.length % 2;
    arr.forEach((item, index) => {
        if (item.id && item.id.toString() === searchId.value) {
            currentIndex = index;
        }
    });
    let activeItem = arr.splice(currentIndex, 1);
    if (remainder === 0) {
        centerIndex = centerIndex - 1;
    }
    arr.splice(centerIndex, 0, activeItem[0]);
    return centerIndex;
};

const setStartEndIndex = (arr: TreeData[], type: 'second' | 'third'): void => {
    let startIndex = 0;
    let endIndex = arr.length - 1;
    if (arr.length > initNum.value) {
        let bothSide = parseInt(String(initNum.value / 2), 10);
        let centerIndex = type === 'second' ? secondTree.value.currentIndex : thirdTree.value.currentIndex;
        if (initNum.value % 2 === 0) {
            startIndex = centerIndex - bothSide + 1 <= 0 ? 0 : centerIndex - bothSide + 1;
        } else {
            startIndex = centerIndex - bothSide <= 0 ? 0 : centerIndex - bothSide;
        }
        if (startIndex + initNum.value - 1 > arr.length - 1) {
            endIndex = arr.length - 1;
            startIndex = endIndex - initNum.value + 1;
        } else {
            endIndex = startIndex + initNum.value - 1;
        }
    }
    if (type === 'second') {
        secondTree.value.startIndex = startIndex;
        secondTree.value.endIndex = endIndex;
    } else {
        thirdTree.value.startIndex = startIndex;
        thirdTree.value.endIndex = endIndex;
    }
};

const personClick = (params: PersonClickParams): void => {
    isRequestThird.value = false;
    let { hierarchy, isOpen, personData } = params;
    if (hierarchy === 'first') {
        treeData.value!.isOpen = !isOpen;
        if (isOpen) {
            foldType.value = 'none';
            setActivePerson({
                data: treeData.value!,
                hierarchy: 'first'
            });
        } else {
            let hasOpen = treeData.value!.children.some(item => item.isOpen);
            foldType.value = hasOpen ? 'all' : 'second';
        }
    } else if (hierarchy === 'second') {
        isRequestThird.value = true;
        treeData.value!.children.forEach((item, index) => {
            if (item.id === personData.id) {
                secondTree.value.currentIndex = index;
            }
        });
        if (isOpen) {
            secondData.value.forEach(item => {
                if (item.id === personData.id) {
                    item.isOpen = false;
                    foldType.value = 'second';
                    setActivePerson({
                        hierarchy: 'second',
                        data: item
                    });
                }
            });
        } else {
            treeData.value!.children.forEach(item => {
                item.isOpen = false;
                if (item.id === personData.id) {
                    item.isOpen = true;
                    foldType.value = 'all';
                    setActivePerson({
                        hierarchy: 'second',
                        data: item
                    });
                    queryThirdPerson(personData);
                }
            });
        }
    } else if (hierarchy === 'third') {
        selectThirdChildrenData(personData);
    }
    secondId.value = personData.id.toString();
};

const queryThirdPerson = (item: TreeData): void => {
    if (catchThirdData.value[item.id]) {
        hasThird.value = true;
        thirdAll.value = catchThirdData.value[item.id];
        handleThirdData();
    } else {
        searchId.value = item.id.toString();
        hasThird.value = false;
        innerRequest({
            type: 'isSecondRequest',
            id: item.id
        });
    }
};

const goPage = (arr: TreeData[], flag: boolean, pageType: 'previous' | 'next', hierarchy: 'second' | 'third'): void => {
    let { startIndex: secondStartIndex, endIndex: secondEndIndex } = secondTree.value;
    let { startIndex: thirdStartIndex, endIndex: thirdEndIndex } = thirdTree.value;
    if (flag) {
        isRequestThird.value = false;
        secondId.value = '';
        let startIndex = hierarchy === 'second' ? secondStartIndex : thirdStartIndex;
        let endIndex = hierarchy === 'second' ? secondEndIndex : thirdEndIndex;
        if (pageType === 'previous') {
            if (startIndex > initNum.value) {
                endIndex = startIndex - 1;
                startIndex = startIndex - initNum.value;
            } else {
                startIndex = 0;
                endIndex = initNum.value - 1;
            }
        } else if (pageType === 'next') {
            if (arr.length - 1 - endIndex > initNum.value) {
                startIndex = endIndex + 1;
                endIndex = endIndex + initNum.value;
            } else {
                startIndex = arr.length - initNum.value;
                endIndex = arr.length - 1;
            }
        }
        if (hierarchy === 'second') {
            secondTree.value.startIndex = startIndex;
            secondTree.value.endIndex = endIndex;
        } else if (hierarchy === 'third') {
            thirdTree.value.startIndex = startIndex;
            thirdTree.value.endIndex = endIndex;
        }
    }
};

const selectThirdChildrenData = (item: TreeData): void => {
    catchThirdData.value = {};
    searchId.value = item.id.toString();
    innerRequest({
        id: item.id
    });
};

const setActivePerson = (params: { data: TreeData; hierarchy: 'first' | 'second' | 'third' }): void => {
    let data = activePerson.value.data;
    if (data && data.id === params.data.id) {
        return;
    }
    activePerson.value.data = params.data;
    activePerson.value.inLevel = params.hierarchy;
    mitt.emit('activePerson', params.data);
};

const setCardNum = (): void => {
    let width = document.body.clientWidth;
    let { minWidth, maxWidth, cardWidth } = treeStyle.value;
    if (width < minWidth) {
        width = minWidth;
    } else if (width > maxWidth) {
        width = maxWidth;
    }
    initNum.value = Math.floor((width - 100) / cardWidth);
};

const handleThirdData = (): void => {
    let activePersonData = activePerson.value.data;
    if (!activePersonData) return;
    
    thirdAll.value.forEach((item, index) => {
        if (item.id === activePersonData.id) {
            thirdTree.value.currentIndex = index;
        }
    });
    setStartEndIndex(thirdAll.value, 'third');
};

// Watch
watch(() => address.value, (val) => {
    if (!val.isSecondRequest) {
        searchId.value = val.focusId || '';
        treeData.value = null;
        isRequestThird.value = false;
        catchThirdData.value = {};
        setCardNum();
    }
    getData();
}, { deep: true });

// Lifecycle hooks
onMounted(() => {
    if (props.params.style) {
        for (const key in props.params.style) {
            if (key === 'cardWidth') {
                const { cardWidth, cardMargin } = props.params.style;
                treeStyle.value.cardWidth = (cardWidth || 0) + (cardMargin || 0) * 2 + 4;
            }
            else {
                const value = key as keyof TreeStyle;
                (treeStyle.value as any)[value] = props.params.style[value];
            }
        }
    }
    searchId.value = props.params.focusId || '';
    getData();
    
    clientWidth.value = document.body.clientWidth;
    setCardNum();
    
    const handleResize = () => {
        const _clientWidth = document.body.clientWidth;

        if (Math.abs(_clientWidth - clientWidth.value) >= treeStyle.value.cardWidth) {
            let num = initNum.value;
            setCardNum();
            let changeNum = initNum.value - num;
            if (changeNum) {
                clientWidth.value = document.body.clientWidth;
                if (treeData.value?.children) {
                    setStartEndIndex(treeData.value.children, 'second');
                }
                setStartEndIndex(thirdAll.value, 'third');
            }
        }
    };
    window.addEventListener('resize', handleResize);
    
    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
        if (timer.value) {
            clearTimeout(timer.value);
        }
    });
});

</script>