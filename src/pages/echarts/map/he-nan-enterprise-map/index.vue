<template>
    <div class="he-nan-enterprise-map">
        <h2>河南企业迁入示例</h2>
        <he-nan-enterprise-join />
    </div>
</template>

<script setup lang="ts" name="HeNanEnterpriseJoinPage">
import HeNanEnterpriseJoin from './he-nan-enterprise-join.vue';
</script>

<style lang="scss" scoped>
.he-nan-enterprise-map {
    padding: 20px;
    h2 {
        text-align: center;
        margin-bottom: 20px;
        color: #333;
    }
}
</style>
