<template>
  <div class="work-card card" @click="goDetail">
    <div v-if="work.mediaUrl" class="work-media">
      <img v-if="work.mediaType === 'image'" :src="work.mediaUrl" alt="作品图片" />
      <div v-else class="video-placeholder" @click.stop="openMediaLink">
        <el-icon size="48"><VideoPlay /></el-icon>
        <span>点击播放视频</span>
        <span class="video-tag">视频</span>
      </div>
    </div>
    <div class="work-content">
      <div class="work-header">
        <router-link :to="`/buddies/${work.userId}`" class="user-row" @click.stop>
          <img v-if="work.user" :src="work.user.avatar" class="avatar-sm" />
          <div class="user-info">
            <span class="username">{{ work.user?.username || '匿名用户' }}</span>
            <span class="level-badge">{{ work.user?.skillLevel }}</span>
          </div>
        </router-link>
      </div>
      
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
      
      <p class="work-text">{{ work.content }}</p>
      
      <div class="work-footer">
        <span class="time">{{ formatTime(work.createdAt) }}</span>
        <div class="actions">
          <span class="action-item" :class="{ active: work.isLiked }" @click.stop="handleLike">
            <el-icon><component :is="work.isLiked ? 'StarFilled' : 'Star'" /></el-icon>
            <span>{{ work.likesCount || 0 }}</span>
          </span>
          <span class="action-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ work.commentsCount || 0 }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { MagicStick, Notebook, Star, StarFilled, ChatDotRound, VideoPlay } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { workApi } from '../api'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { inject } from 'vue'

const props = defineProps({
  work: { type: Object, required: true }
})

const emit = defineEmits(['update'])

const router = useRouter()
const userStore = useUserStore()
const requireLogin = inject('requireLogin', () => router.push('/login'))

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

const goDetail = () => {
  router.push(`/works/${props.work.id}`)
}

const openMediaLink = () => {
  if (props.work.mediaUrl) {
    window.open(props.work.mediaUrl, '_blank')
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  
  try {
    if (props.work.isLiked) {
      await workApi.unlike(props.work.id, { userId: userStore.userId })
      props.work.isLiked = false
      props.work.likesCount--
    } else {
      await workApi.like(props.work.id, { userId: userStore.userId })
      props.work.isLiked = true
      props.work.likesCount++
    }
    emit('update')
  } catch (e) {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.work-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 0;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.work-media {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--bg-light);
}

.work-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-secondary);
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.video-placeholder:hover {
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
}

.video-placeholder:hover .el-icon {
  transform: scale(1.1);
}

.video-placeholder .el-icon {
  color: var(--primary-color);
  transition: transform 0.3s;
}

.video-placeholder span {
  font-size: 13px;
  font-weight: 500;
}

.video-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px !important;
  font-weight: 600 !important;
}

.work-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.work-header {
  display: flex;
  align-items: center;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.level-badge {
  font-size: 11px;
  padding: 1px 6px;
  background: #eef2ff;
  color: var(--primary-dark);
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}

.work-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 10px;
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

.work-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.work-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.time {
  font-size: 12px;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 16px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.action-item:hover {
  color: var(--primary-color);
}

.action-item.active {
  color: var(--primary-color);
}
</style>
