<template>
    <div class="xi-an-enterprise-map">
        <h2>西安企业分布图示例</h2>
        <xi-an-enterprise-map />
    </div>
</template>

<script setup lang="ts" name="XiAnEnterpriseMapPage">
import XiAnEnterpriseMap from './xi-an-enterprise-map.vue';
</script>

<style lang="scss" scoped>
.xi-an-enterprise-map {
    padding: 20px;
    h2 {
        text-align: center;
        margin-bottom: 20px;
        color: #333;
    }
}
</style>
