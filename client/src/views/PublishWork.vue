<template>
  <div class="publish-work-page">
    <div class="page-header">
      <div class="container">
        <h1>✨ 发布练习成果</h1>
        <p>分享你的练习成果，和搭子互相激励</p>
      </div>
    </div>
    
    <div class="container">
      <div class="publish-form card">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" @submit.prevent>
          <el-form-item label="练习乐器" prop="instrument">
            <el-select v-model="form.instrument" placeholder="选择乐器" style="width: 100%">
              <el-option v-for="inst in instrumentOptions" :key="inst" :label="inst" :value="inst" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="练习曲目" prop="piece">
            <el-select 
              v-model="form.piece" 
              filterable 
              allow-create 
              default-first-option 
              placeholder="选择或输入曲目" 
              style="width: 100%"
            >
              <el-option v-for="p in pieceOptions" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="练习心得" prop="content">
            <el-input 
              v-model="form.content" 
              type="textarea" 
              :rows="6" 
              placeholder="分享你的练习心得、感悟、技巧..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="媒体类型">
            <el-radio-group v-model="form.mediaType">
              <el-radio value="image">
                <el-icon><Picture /></el-icon>
                图片
              </el-radio>
              <el-radio value="video">
                <el-icon><VideoPlay /></el-icon>
                视频
              </el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="媒体链接" v-if="form.mediaType">
            <el-input 
              v-model="form.mediaUrl" 
              :placeholder="form.mediaType === 'image' ? '请输入图片链接' : '请输入视频链接'"
            />
            <div class="form-tip">
              <el-icon size="14"><InfoFilled /></el-icon>
              <span>请输入可以直接访问的图片或视频链接</span>
            </div>
          </el-form-item>
          
          <el-form-item v-if="form.mediaUrl">
            <div class="media-preview">
              <span class="preview-label">预览：</span>
              <div v-if="form.mediaType === 'image'" class="preview-image">
                <img :src="form.mediaUrl" alt="预览" @error="imageError = true" v-if="!imageError" />
                <span v-else class="preview-error">图片加载失败，请检查链接</span>
              </div>
              <div v-else class="preview-video">
                <el-icon size="32"><VideoPlay /></el-icon>
                <span>视频链接已填写</span>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" size="large" :loading="submitting" @click="submit">
              <el-icon><Promotion /></el-icon>
              发布作品
            </el-button>
            <el-button size="large" @click="goBack">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { workApi, recommendApi } from '../api'
import { ElMessage } from 'element-plus'
import { Picture, VideoPlay, InfoFilled, Promotion } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const submitting = ref(false)
const imageError = ref(false)
const pieceOptions = ref([])

const form = reactive({
  userId: userStore.userId,
  instrument: '',
  piece: '',
  content: '',
  mediaUrl: '',
  mediaType: 'image'
})

const rules = {
  instrument: [{ required: true, message: '请选择乐器', trigger: 'change' }],
  piece: [{ required: true, message: '请输入曲目', trigger: 'blur' }],
  content: [
    { required: true, message: '请输入练习心得', trigger: 'blur' },
    { min: 10, message: '心得内容至少10个字', trigger: 'blur' }
  ]
}

const instrumentOptions = computed(() => {
  const base = userStore.currentUser?.instruments || []
  return [...new Set([...base, '古典吉他', '钢琴', '小提琴', '尤克里里', '架子鼓', '竹笛', '洞箫', '电子琴', '二胡', '古筝'])]
})

onMounted(async () => {
  form.instrument = userStore.currentUser?.instruments?.[0] || instrumentOptions.value[0]
  try {
    const result = await recommendApi.pieces(userStore.userId)
    pieceOptions.value = result.recommendations.map(r => r.piece).slice(0, 20)
  } catch (e) {}
})

const submit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  
  submitting.value = true
  try {
    const result = await workApi.create({
      userId: form.userId,
      instrument: form.instrument,
      piece: form.piece,
      content: form.content,
      mediaUrl: form.mediaUrl,
      mediaType: form.mediaType
    })
    
    if (result.success) {
      ElMessage.success('发布成功！')
      router.push('/works')
    }
  } catch (e) {
    ElMessage.error('发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.page-header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 40px 0;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.page-header p {
  font-size: 15px;
  opacity: 0.9;
}

.publish-form {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}

.media-preview {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.preview-label {
  font-size: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.preview-image {
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-error {
  font-size: 12px;
  color: var(--color-danger);
}

.preview-video {
  width: 200px;
  height: 150px;
  border-radius: 8px;
  background: var(--bg-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
}
</style>
