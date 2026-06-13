<template>
  <div class="work-detail" v-if="work">
    <div class="container">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/works' }">练习成果墙</el-breadcrumb-item>
        <el-breadcrumb-item>作品详情</el-breadcrumb-item>
      </el-breadcrumb>
      
      <div class="detail-grid">
        <div class="left-col">
          <div class="card mb-20 work-main">
            <div v-if="work.mediaUrl" class="work-media">
              <img v-if="work.mediaType === 'image'" :src="work.mediaUrl" alt="作品图片" />
              <div v-else class="video-container">
                <video 
                  v-if="isVideoPlayable" 
                  :src="work.mediaUrl" 
                  controls 
                  class="video-player"
                />
                <div v-else class="video-placeholder" @click="openMediaLink">
                  <el-icon size="64"><VideoPlay /></el-icon>
                  <p class="video-title">点击播放视频</p>
                  <p class="video-hint">将在新窗口打开</p>
                </div>
                <div class="video-actions">
                  <el-button type="primary" size="small" @click="openMediaLink">
                    <el-icon><Open /></el-icon>
                    在新窗口打开
                  </el-button>
                </div>
              </div>
            </div>
            
            <div class="work-info">
              <div class="work-meta">
                <span class="meta-tag instrument">
                  <el-icon><MagicStick /></el-icon>
                  {{ work.instrument }}
                </span>
                <span class="meta-tag piece">
                  <el-icon><Notebook /></el-icon>
                  {{ work.piece }}
                </span>
              </div>
              
              <h1 class="work-title">{{ work.piece }}</h1>
              
              <p class="work-content">{{ work.content }}</p>
              
              <div class="work-footer">
                <span class="publish-time">
                  <el-icon><Clock /></el-icon>
                  发布于 {{ formatTime(work.createdAt) }}
                </span>
                <div class="action-buttons">
                  <el-button 
                    :type="work.isLiked ? 'warning' : 'default'" 
                    size="large"
                    @click="handleLike"
                    :loading="likeLoading"
                  >
                    <el-icon><component :is="work.isLiked ? 'StarFilled' : 'Star'" /></el-icon>
                    {{ work.isLiked ? '已点赞' : '点赞' }} ({{ work.likesCount || 0 }})
                  </el-button>
                  <el-button size="large" @click="scrollToComments">
                    <el-icon><ChatDotRound /></el-icon>
                    评论 ({{ work.commentsCount || 0 }})
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card" id="comments-section">
            <h3><el-icon><ChatLineSquare /></el-icon> 评论 ({{ comments.length }})</h3>
            
            <div class="comment-input" v-if="userStore.isLoggedIn">
              <img :src="userStore.currentUser.avatar" class="avatar-sm" />
              <div class="input-wrap">
                <el-input
                  v-model="commentContent"
                  type="textarea"
                  :rows="3"
                  placeholder="说点什么吧..."
                  maxlength="500"
                  show-word-limit
                />
                <div class="submit-row">
                  <el-button type="primary" :loading="commentLoading" @click="submitComment">
                    发表评论
                  </el-button>
                </div>
              </div>
            </div>
            <div v-else class="login-tip">
              <el-button type="primary" @click="goLogin">登录后发表评论</el-button>
            </div>
            
            <div class="comment-list" v-if="comments.length">
              <div class="comment-item" v-for="c in comments" :key="c.id">
                <router-link :to="`/buddies/${c.userId}`">
                  <img :src="c.user?.avatar" class="avatar-sm" />
                </router-link>
                <div class="comment-content">
                  <div class="comment-header">
                    <router-link :to="`/buddies/${c.userId}`" class="commenter">
                      {{ c.user?.username || '匿名用户' }}
                    </router-link>
                    <span class="comment-time">{{ formatTime(c.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ c.content }}</p>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <el-icon><ChatDotRound /></el-icon>
              <p>暂无评论，快来抢沙发吧～</p>
            </div>
          </div>
        </div>
        
        <div class="right-col">
          <div class="card author-card mb-20">
            <router-link :to="`/buddies/${work.userId}`" class="author-info">
              <img :src="work.user?.avatar" class="avatar-lg" />
              <div class="author-text">
                <span class="author-name">{{ work.user?.username }}</span>
                <span class="author-level">{{ work.user?.skillLevel }}</span>
              </div>
            </router-link>
            <p class="author-bio">{{ work.user?.bio }}</p>
            <div class="author-stats">
              <div class="stat-item">
                <span class="num">{{ work.user?.reviewCount || 0 }}</span>
                <span class="label">评价</span>
              </div>
              <div class="stat-item">
                <span class="num">{{ work.user?.instruments?.length || 0 }}</span>
                <span class="label">乐器</span>
              </div>
            </div>
            <el-button 
              type="primary" 
              size="large" 
              class="invite-btn"
              v-if="userStore.isLoggedIn && work.userId !== userStore.userId"
              @click="showInvite = true"
            >
              <el-icon><ChatDotRound /></el-icon>
              邀约练琴
            </el-button>
            <router-link 
              :to="`/buddies/${work.userId}`" 
              class="view-profile"
              v-else-if="!userStore.isLoggedIn || work.userId !== userStore.userId"
            >
              查看主页 →
            </router-link>
          </div>
          
          <div class="card" v-if="otherWorks.length">
            <h3><el-icon><Picture /></el-icon> TA的其他作品</h3>
            <div class="other-works">
              <router-link 
                v-for="w in otherWorks" 
                :key="w.id" 
                :to="`/works/${w.id}`"
                class="other-work-item"
              >
                <div v-if="w.mediaUrl" class="other-work-thumb">
                  <img :src="w.mediaUrl" />
                </div>
                <div class="other-work-info">
                  <div class="other-work-title">{{ w.piece }}</div>
                  <div class="other-work-meta">
                    <span>{{ w.instrument }}</span>
                    <span>{{ w.likesCount || 0 }}赞</span>
                  </div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <el-dialog v-model="showInvite" title="发送练琴邀约" width="500px">
      <el-form :model="inviteForm" label-width="100px">
        <el-form-item label="邀约对象"><span>{{ work.user?.username }}</span></el-form-item>
        <el-form-item label="乐器">
          <el-select v-model="inviteForm.instrument" style="width: 100%">
            <el-option v-for="inst in sharedInstruments" :key="inst" :label="inst" :value="inst" />
          </el-select>
        </el-form-item>
        <el-form-item label="想练曲目">
          <el-input v-model="inviteForm.piece" :placeholder="'如：' + work.piece" />
        </el-form-item>
        <el-form-item label="约练时间">
          <el-date-picker v-model="inviteForm.meetTime" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="约练地点">
          <el-input v-model="inviteForm.location" placeholder="建议公共空间" />
        </el-form-item>
        <el-form-item label="留言">
          <el-input v-model="inviteForm.message" type="textarea" :rows="3" placeholder="看了你的作品，想约你一起练琴..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInvite = false">取消</el-button>
        <el-button type="primary" :loading="inviteLoading" @click="submitInvite">发送邀约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { workApi, invitationApi } from '../api'
import { ElMessage } from 'element-plus'
import { 
  MagicStick, Notebook, Clock, Star, StarFilled, ChatDotRound, 
  ChatLineSquare, VideoPlay, Picture, Open
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const requireLogin = inject('requireLogin', () => router.push('/login'))

const work = ref(null)
const comments = ref([])
const otherWorks = ref([])
const likeLoading = ref(false)
const commentLoading = ref(false)
const commentContent = ref('')
const showInvite = ref(false)
const inviteLoading = ref(false)

const inviteForm = reactive({
  instrument: '',
  piece: '',
  meetTime: null,
  location: '',
  message: ''
})

const sharedInstruments = computed(() => {
  if (!work.value) return []
  const mine = userStore.currentUser?.instruments || []
  const theirs = work.value.user?.instruments || []
  const shared = mine.filter(i => theirs.includes(i))
  return shared.length ? shared : theirs
})

const isVideoPlayable = computed(() => {
  if (!work.value?.mediaUrl) return false
  const url = work.value.mediaUrl.toLowerCase()
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')
})

const openMediaLink = () => {
  if (work.value?.mediaUrl) {
    window.open(work.value.mediaUrl, '_blank')
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadWork = async () => {
  try {
    const params = {}
    if (userStore.isLoggedIn) {
      params.currentUserId = userStore.userId
    }
    work.value = await workApi.get(route.params.id, params)
    inviteForm.instrument = sharedInstruments.value[0] || work.value.instrument
    inviteForm.piece = work.value.piece
    loadOtherWorks()
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const loadComments = async () => {
  try {
    comments.value = await workApi.listComments(route.params.id)
  } catch (e) {
    ElMessage.error('加载评论失败')
  }
}

const loadOtherWorks = async () => {
  try {
    const all = await workApi.list({ userId: work.value.userId })
    otherWorks.value = all.filter(w => w.id !== work.value.id).slice(0, 3)
  } catch (e) {}
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  
  likeLoading.value = true
  try {
    if (work.value.isLiked) {
      await workApi.unlike(work.value.id, { userId: userStore.userId })
      work.value.isLiked = false
      work.value.likesCount--
      ElMessage.success('已取消点赞')
    } else {
      await workApi.like(work.value.id, { userId: userStore.userId })
      work.value.isLiked = true
      work.value.likesCount++
      ElMessage.success('点赞成功！')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    likeLoading.value = false
  }
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  
  commentLoading.value = true
  try {
    await workApi.addComment(route.params.id, {
      userId: userStore.userId,
      content: commentContent.value
    })
    ElMessage.success('评论成功！')
    commentContent.value = ''
    await loadComments()
    work.value.commentsCount++
  } catch (e) {
    ElMessage.error('评论失败')
  } finally {
    commentLoading.value = false
  }
}

const scrollToComments = () => {
  const el = document.getElementById('comments-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const goLogin = () => {
  router.push('/login')
}

const submitInvite = async () => {
  if (!userStore.isLoggedIn) {
    showInvite.value = false
    requireLogin()
    return
  }
  if (!inviteForm.instrument || !inviteForm.meetTime || !inviteForm.location) {
    ElMessage.warning('请填写完整信息')
    return
  }
  inviteLoading.value = true
  try {
    await invitationApi.create({
      inviterId: userStore.userId,
      inviteeId: work.value.userId,
      instrument: inviteForm.instrument,
      piece: inviteForm.piece,
      skillLevelMatch: `${userStore.currentUser.skillLevel}-${work.value.user.skillLevel}`,
      meetTime: new Date(inviteForm.meetTime).toLocaleString('zh-CN', { hour12: false }),
      location: inviteForm.location,
      latitude: work.value.user.latitude,
      longitude: work.value.user.longitude,
      message: inviteForm.message
    })
    ElMessage.success('邀约已发送！')
    showInvite.value = false
    router.push('/messages')
  } catch (e) {
    ElMessage.error('发送失败')
  } finally {
    inviteLoading.value = false
  }
}

onMounted(async () => {
  await loadWork()
  await loadComments()
})
</script>

<style scoped>
.breadcrumb {
  margin: 20px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.work-main {
  padding: 0;
  overflow: hidden;
}

.work-media {
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  background: var(--bg-light);
}

.work-media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 400px;
}

.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  gap: 16px;
}

.video-player {
  width: 100%;
  max-height: 400px;
  border-radius: 8px;
  background: #000;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 60px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s;
}

.video-placeholder:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.02);
}

.video-placeholder .el-icon {
  color: var(--primary-color);
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.video-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.video-actions {
  margin-top: 8px;
}

.work-info {
  padding: 24px;
}

.work-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 6px;
}

.meta-tag.instrument {
  background: #eef2ff;
  color: var(--primary-dark);
}

.meta-tag.piece {
  background: #fdf2f8;
  color: #be185d;
}

.work-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.work-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.work-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.publish-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  margin-bottom: 16px;
}

.comment-input {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.input-wrap {
  flex: 1;
}

.submit-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.login-tip {
  text-align: center;
  padding: 20px;
  margin-bottom: 20px;
  background: var(--bg-light);
  border-radius: 8px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.commenter {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.comment-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}

.author-card {
  text-align: center;
}

.author-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.avatar-lg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #e0e7ff;
}

.author-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.author-level {
  font-size: 12px;
  padding: 2px 8px;
  background: #eef2ff;
  color: var(--primary-dark);
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
  margin: 0 auto;
}

.author-bio {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.author-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-item .num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-item .label {
  font-size: 12px;
  color: var(--text-secondary);
}

.invite-btn {
  width: 100%;
}

.view-profile {
  display: block;
  text-align: center;
  color: var(--primary-color);
  font-size: 14px;
  margin-top: 8px;
}

.other-works {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.other-work-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.other-work-item:hover {
  background: var(--bg-light);
}

.other-work-thumb {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.other-work-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.other-work-info {
  flex: 1;
  min-width: 0;
}

.other-work-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.other-work-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.empty-state.small {
  padding: 30px 10px;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
