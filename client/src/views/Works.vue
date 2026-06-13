<template>
  <div class="works-page">
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div>
            <h1>🎨 练习成果墙</h1>
            <p>分享你的练习成果，和搭子互相激励</p>
          </div>
          <el-button type="primary" size="large" @click="goPublish" v-if="userStore.isLoggedIn">
            <el-icon><Plus /></el-icon>
            发布作品
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="container">
      <div class="filter-bar card mb-20">
        <div class="filter-left">
          <el-radio-group v-model="filterType" size="default" @change="loadWorks">
            <el-radio-button value="all">全部作品</el-radio-button>
            <el-radio-button value="mine" v-if="userStore.isLoggedIn">我的作品</el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-right">
          <el-select v-model="filterInstrument" placeholder="选择乐器" clearable size="default" @change="loadWorks" style="width: 160px">
            <el-option v-for="inst in instrumentOptions" :key="inst" :label="inst" :value="inst" />
          </el-select>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索曲目或内容..."
            clearable
            size="default"
            style="width: 240px"
            @keyup.enter="loadWorks"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>
      
      <div v-if="works.length" class="works-grid">
        <WorkCard v-for="work in works" :key="work.id" :work="work" @update="loadWorks" />
      </div>
      <div v-else class="empty-state card">
        <el-icon size="48"><Picture /></el-icon>
        <p>{{ filterType === 'mine' ? '你还没有发布过作品，快去发布第一个吧！' : '暂无作品' }}</p>
        <el-button type="primary" @click="goPublish" v-if="userStore.isLoggedIn && filterType === 'mine'">
          发布作品
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { workApi, recommendApi } from '../api'
import WorkCard from '../components/WorkCard.vue'
import { Plus, Search, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const works = ref([])
const filterType = ref('all')
const filterInstrument = ref('')
const searchKeyword = ref('')
const loading = ref(false)

const instrumentOptions = computed(() => {
  const base = userStore.currentUser?.instruments || []
  return [...new Set([...base, '古典吉他', '钢琴', '小提琴', '尤克里里', '架子鼓', '竹笛', '洞箫', '电子琴'])]
})

const loadWorks = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterType.value === 'mine' && userStore.isLoggedIn) {
      params.userId = userStore.userId
    }
    if (filterInstrument.value) {
      params.instrument = filterInstrument.value
    }
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (userStore.isLoggedIn) {
      params.currentUserId = userStore.userId
    }
    works.value = await workApi.list(params)
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const goPublish = () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/publish-work')
}

onMounted(() => {
  loadWorks()
})
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 0;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  font-size: 32px;
  margin-bottom: 8px;
}

.page-header p {
  font-size: 16px;
  opacity: 0.9;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.filter-right {
  display: flex;
  gap: 12px;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-state .el-icon {
  color: var(--text-secondary);
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filter-right {
    flex-direction: column;
  }
  
  .filter-right .el-select,
  .filter-right .el-input {
    width: 100% !important;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .works-grid {
    grid-template-columns: 1fr;
  }
}
</style>
