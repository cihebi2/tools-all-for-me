// 音频音量调整工具 JavaScript
class AudioVolumeAdjuster {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.gainNode = null;
        this.sourceNode = null;
        this.isPlaying = false;
        this.currentFile = null;
        this.processedBlob = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupAudioContext();
    }

    initializeElements() {
        // 获取DOM元素
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('audioFile');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.uploadError = document.getElementById('uploadError');
        
        this.controlSection = document.getElementById('controlSection');
        this.audioControls = document.getElementById('audioControls');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.gainDisplay = document.getElementById('gainDisplay');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        
        this.previewSection = document.getElementById('previewSection');
        this.waveformContainer = document.getElementById('waveformContainer');
        this.playBtn = document.getElementById('playBtn');
        this.currentTimeSpan = document.getElementById('currentTime');
        this.durationSpan = document.getElementById('duration');
        this.audioElement = document.getElementById('audioElement');
        
        this.processSection = document.getElementById('processSection');
        this.processBtn = document.getElementById('processBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
        
        this.resultSection = document.getElementById('resultSection');
        this.downloadSection = document.getElementById('downloadSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newFileBtn = document.getElementById('newFileBtn');

        // 步骤指示器
        this.steps = {
            step1: document.getElementById('step1'),
            step2: document.getElementById('step2'),
            step3: document.getElementById('step3'),
            step4: document.getElementById('step4')
        };
    }

    setupEventListeners() {
        // 文件上传事件
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // 音量控制
        this.volumeSlider.addEventListener('input', (e) => this.handleVolumeChange(e));
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePresetClick(e));
        });
        
        // 播放控制
        this.playBtn.addEventListener('click', () => this.togglePlayback());
        
        // 处理和下载
        this.processBtn.addEventListener('click', () => this.processAudio());
        this.newFileBtn.addEventListener('click', () => this.resetTool());
        
        // 音频元素事件
        this.audioElement.addEventListener('timeupdate', () => this.updateTimeDisplay());
        this.audioElement.addEventListener('ended', () => this.onAudioEnded());
        this.audioElement.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
    }

    async setupAudioContext() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('音频上下文初始化成功');
        } catch (error) {
            console.error('音频上下文初始化失败:', error);
            this.showError('您的浏览器不支持Web Audio API');
        }
    }

    // 文件处理方法
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.loadAudioFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.loadAudioFile(files[0]);
        }
    }

    async loadAudioFile(file) {
        // 验证文件类型
        if (!file.type.startsWith('audio/')) {
            this.showError('请选择有效的音频文件');
            return;
        }

        // 验证文件大小 (50MB)
        if (file.size > 50 * 1024 * 1024) {
            this.showError('文件大小不能超过50MB');
            return;
        }

        this.currentFile = file;
        this.hideError();

        // 显示文件信息
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileInfo.classList.add('show');

        try {
            // 创建音频URL并加载到audio元素
            const audioUrl = URL.createObjectURL(file);
            this.audioElement.src = audioUrl;

            // 解码音频文件
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // 更新UI状态
            this.updateStepStatus('step1', 'completed');
            this.updateStepStatus('step2', 'active');
            this.activateSection(this.controlSection);
            this.audioControls.classList.add('show');

            // 生成波形显示
            this.generateWaveform();

            console.log('音频文件加载成功');
        } catch (error) {
            console.error('音频文件加载失败:', error);
            this.showError('音频文件加载失败，请选择其他文件');
        }
    }

    generateWaveform() {
        // 创建简化的波形显示
        const waveformBars = document.createElement('div');
        waveformBars.className = 'waveform-bars';
        
        // 生成10个动画条
        for (let i = 0; i < 10; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.animationDelay = `${i * 0.1}s`;
            waveformBars.appendChild(bar);
        }

        this.waveformContainer.innerHTML = '';
        this.waveformContainer.appendChild(waveformBars);
    }

    // 音量控制方法
    handleVolumeChange(event) {
        const volume = parseInt(event.target.value);
        this.updateVolumeDisplay(volume);
        this.updatePresetButtons(volume);
        
        // 如果正在播放，实时更新音量
        if (this.gainNode) {
            const gainValue = volume / 100;
            this.gainNode.gain.setValueAtTime(gainValue, this.audioContext.currentTime);
        }

        // 更新HTML audio元素音量
        this.audioElement.volume = Math.min(volume / 100, 1);

        // 激活预览和处理部分
        if (volume !== 100) {
            this.updateStepStatus('step2', 'completed');
            this.updateStepStatus('step3', 'active');
            this.activateSection(this.previewSection);
            this.processSection.classList.add('show');
            this.playBtn.disabled = false;
            this.processBtn.disabled = false;
        }
    }

    handlePresetClick(event) {
        const volume = parseInt(event.target.dataset.volume);
        this.volumeSlider.value = volume;
        this.handleVolumeChange({target: {value: volume}});
    }

    updateVolumeDisplay(volume) {
        this.volumeValue.textContent = `${volume}%`;
        
        // 计算增益值（分贝）
        const gainDb = volume === 0 ? -Infinity : 20 * Math.log10(volume / 100);
        this.gainDisplay.textContent = `增益: ${gainDb.toFixed(1)}dB`;
    }

    updatePresetButtons(volume) {
        this.presetBtns.forEach(btn => {
            const presetVolume = parseInt(btn.dataset.volume);
            btn.classList.toggle('active', presetVolume === volume);
        });
    }

    // 音频播放控制
    async togglePlayback() {
        if (this.isPlaying) {
            this.stopAudio();
        } else {
            await this.playAudio();
        }
    }

    async playAudio() {
        try {
            // 恢复音频上下文
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // 停止之前的播放
            if (this.sourceNode) {
                this.sourceNode.stop();
            }

            // 创建新的音频源和增益节点
            this.sourceNode = this.audioContext.createBufferSource();
            this.gainNode = this.audioContext.createGain();

            // 设置音频缓冲区
            this.sourceNode.buffer = this.audioBuffer;

            // 设置增益值
            const volume = parseInt(this.volumeSlider.value);
            const gainValue = volume / 100;
            this.gainNode.gain.setValueAtTime(gainValue, this.audioContext.currentTime);

            // 连接音频节点
            this.sourceNode.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            // 开始播放
            this.sourceNode.start();
            this.audioElement.play();

            this.isPlaying = true;
            this.updatePlayButton();

            // 监听播放结束
            this.sourceNode.addEventListener('ended', () => {
                this.onAudioEnded();
            });

        } catch (error) {
            console.error('播放音频失败:', error);
            this.showError('播放音频失败');
        }
    }

    stopAudio() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode = null;
        }
        
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        
        this.isPlaying = false;
        this.updatePlayButton();
    }

    onAudioEnded() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.audioElement.currentTime = 0;
    }

    updatePlayButton() {
        const icon = this.playBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }

    // 音频处理方法
    async processAudio() {
        this.updateStepStatus('step3', 'completed');
        this.updateStepStatus('step4', 'active');
        
        this.progressContainer.classList.add('show');
        this.processBtn.disabled = true;

        try {
            // 模拟处理进度
            await this.simulateProgress();
            console.log('进度模拟完成，开始音频处理');

            // 添加处理超时保护
            const processTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('音频处理超时')), 30000);
            });

            // 处理音频 - 保持原格式
            this.processedBlob = await Promise.race([
                this.processAudioWithOriginalFormat(),
                processTimeout
            ]);

            console.log('音频处理完成，blob大小:', this.processedBlob.size);

            // 显示下载选项
            this.showDownloadOptions();

        } catch (error) {
            console.error('音频处理失败:', error);
            this.showError(`音频处理失败：${error.message}`);
            this.processBtn.disabled = false;
            this.progressContainer.classList.remove('show');
        }
    }

    // 新的音频处理方法 - 保持原格式
    async processAudioWithOriginalFormat() {
        console.log('开始音频处理');
        const volume = parseInt(this.volumeSlider.value);
        const gainValue = volume / 100;

        console.log('音量设置:', volume + '%', '增益值:', gainValue);

        // 如果音量是100%，直接返回原文件
        if (gainValue === 1.0) {
            console.log('音量100%，直接返回原文件');
            return this.currentFile;
        }

        try {
            console.log('创建离线音频上下文');
            // 创建一个新的AudioContext用于离线处理
            const offlineContext = new OfflineAudioContext(
                this.audioBuffer.numberOfChannels,
                this.audioBuffer.length,
                this.audioBuffer.sampleRate
            );

            console.log('设置音频源和增益节点');
            // 创建音频源和增益节点
            const source = offlineContext.createBufferSource();
            const gainNode = offlineContext.createGain();

            source.buffer = this.audioBuffer;
            gainNode.gain.setValueAtTime(gainValue, offlineContext.currentTime);

            // 连接音频节点
            source.connect(gainNode);
            gainNode.connect(offlineContext.destination);

            console.log('开始离线渲染');
            // 开始离线渲染
            source.start();
            const renderedBuffer = await offlineContext.startRendering();
            
            console.log('离线渲染完成，开始编码');

            // 临时简化：直接使用WAV格式避免MediaRecorder问题
            console.log('使用WAV格式编码（临时简化版本）');
            return await this.audioBufferToWav(renderedBuffer);

        } catch (error) {
            console.error('音频处理过程中出错:', error);
            throw error;
        }
    }

    async applyVolumeGain() {
        const volume = parseInt(this.volumeSlider.value);
        const gainValue = volume / 100;

        // 创建新的音频缓冲区
        const processedBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            this.audioBuffer.length,
            this.audioBuffer.sampleRate
        );

        // 应用增益到每个声道
        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const inputData = this.audioBuffer.getChannelData(channel);
            const outputData = processedBuffer.getChannelData(channel);
            
            for (let sample = 0; sample < inputData.length; sample++) {
                outputData[sample] = inputData[sample] * gainValue;
                
                // 防止削波
                if (outputData[sample] > 1) outputData[sample] = 1;
                if (outputData[sample] < -1) outputData[sample] = -1;
            }
        }

        return processedBuffer;
    }

    // 根据原文件格式编码音频缓冲区
    async encodeAudioBuffer(buffer, originalMimeType) {
        // 获取原文件扩展名
        const originalType = originalMimeType.toLowerCase();
        
        console.log('开始编码音频，原格式:', originalType);
        
        try {
            // 对于支持的原生格式，尝试使用MediaRecorder
            if (this.isSupportedForMediaRecorder(originalType)) {
                console.log('尝试使用MediaRecorder保持原格式');
                const result = await this.encodeWithMediaRecorder(buffer, originalType);
                console.log('MediaRecorder编码成功');
                return result;
            } else {
                console.log('原格式不支持MediaRecorder，直接使用WAV');
            }
        } catch (error) {
            console.warn('MediaRecorder编码失败，降级到WAV:', error);
        }

        // 降级到WAV格式
        console.log('使用WAV格式编码');
        return await this.audioBufferToWav(buffer);
    }

    // 检查MediaRecorder是否支持该格式
    isSupportedForMediaRecorder(mimeType) {
        const supportedTypes = [
            'audio/webm',
            'audio/webm;codecs=opus',
            'audio/ogg',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/mpeg'
        ];
        
        return supportedTypes.some(type => 
            MediaRecorder.isTypeSupported(type) && 
            (mimeType.includes('webm') || mimeType.includes('ogg') || 
             mimeType.includes('mp4') || mimeType.includes('mpeg'))
        );
    }

    // 使用MediaRecorder编码（保持接近原格式）
    async encodeWithMediaRecorder(buffer, originalType) {
        return new Promise((resolve, reject) => {
            try {
                // 创建音频源
                const context = new AudioContext();
                const source = context.createBufferSource();
                const destination = context.createMediaStreamDestination();
                
                source.buffer = buffer;
                source.connect(destination);

                // 选择合适的编码格式
                let mimeType = 'audio/webm;codecs=opus';
                if (originalType.includes('ogg')) {
                    mimeType = 'audio/ogg;codecs=opus';
                } else if (originalType.includes('mp4')) {
                    mimeType = 'audio/mp4';
                }

                // 确保格式被支持
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/webm;codecs=opus';
                }

                console.log('使用MediaRecorder编码，格式:', mimeType);

                const mediaRecorder = new MediaRecorder(destination.stream, {
                    mimeType: mimeType,
                    audioBitsPerSecond: 128000
                });

                const chunks = [];
                let isResolved = false;
                
                mediaRecorder.ondataavailable = (event) => {
                    console.log('MediaRecorder数据可用，大小:', event.data.size);
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    console.log('MediaRecorder停止，chunks数量:', chunks.length);
                    if (!isResolved) {
                        isResolved = true;
                        const blob = new Blob(chunks, { type: mimeType });
                        context.close().then(() => {
                            console.log('AudioContext已关闭，编码完成，blob大小:', blob.size);
                            resolve(blob);
                        }).catch(() => {
                            // 即使关闭失败也要resolve
                            resolve(blob);
                        });
                    }
                };

                mediaRecorder.onerror = (error) => {
                    console.error('MediaRecorder错误:', error);
                    if (!isResolved) {
                        isResolved = true;
                        context.close().catch(() => {});
                        reject(error);
                    }
                };

                // 音频时长（秒）
                const duration = buffer.length / buffer.sampleRate;
                console.log('音频时长:', duration, '秒');

                // 开始录制
                mediaRecorder.start();
                source.start();

                // 添加超时保护，最长等待30秒
                const maxTimeout = Math.max(duration * 1000 + 500, 30000);
                const timeoutId = setTimeout(() => {
                    console.log('MediaRecorder超时，强制停止');
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                    if (!isResolved) {
                        isResolved = true;
                        context.close().catch(() => {});
                        reject(new Error('录制超时'));
                    }
                }, maxTimeout);

                // 在音频播放完成后停止录制
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        console.log('正常停止MediaRecorder');
                        mediaRecorder.stop();
                    }
                    clearTimeout(timeoutId);
                }, duration * 1000 + 200);

            } catch (error) {
                console.error('MediaRecorder初始化失败:', error);
                reject(error);
            }
        });
    }

    async audioBufferToWav(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const length = buffer.length;
        
        // 计算WAV文件大小
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV文件头
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        // RIFF头
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        
        // fmt子块
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        
        // data子块
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);

        // 音频数据
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    async simulateProgress() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                
                this.progressFill.style.width = `${progress}%`;
                this.progressText.textContent = `正在处理音频... ${Math.round(progress)}%`;
            }, 100);
        });
    }

    showDownloadOptions() {
        this.progressContainer.classList.remove('show');
        this.activateSection(this.resultSection);
        this.downloadSection.classList.add('show');

        // 创建下载链接
        const url = URL.createObjectURL(this.processedBlob);
        this.downloadBtn.href = url;
        
        // 生成文件名，保持原扩展名
        const originalName = this.currentFile.name;
        const lastDotIndex = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
        const originalExt = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';
        const volume = this.volumeSlider.value;
        
        // 根据处理后的blob类型确定扩展名
        let fileExt = originalExt;
        if (this.processedBlob.type.includes('wav')) {
            fileExt = '.wav';
        } else if (this.processedBlob.type.includes('webm')) {
            fileExt = '.webm';
        } else if (this.processedBlob.type.includes('ogg')) {
            fileExt = '.ogg';
        }
        
        this.downloadBtn.download = `${nameWithoutExt}_volume_${volume}%${fileExt}`;
    }

    // 时间显示更新
    updateTimeDisplay() {
        if (this.audioElement.duration) {
            this.currentTimeSpan.textContent = this.formatTime(this.audioElement.currentTime);
            this.durationSpan.textContent = this.formatTime(this.audioElement.duration);
        }
    }

    onMetadataLoaded() {
        this.durationSpan.textContent = this.formatTime(this.audioElement.duration);
    }

    // 工具方法
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateStepStatus(stepId, status) {
        const step = this.steps[stepId];
        step.classList.remove('active', 'completed');
        step.classList.add(status);
    }

    activateSection(section) {
        // 移除所有section的active类
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        // 添加active类到当前section
        section.classList.add('active');
        // 添加动画效果
        section.classList.add('fade-in');
    }

    showError(message) {
        this.uploadError.textContent = message;
        this.uploadError.classList.add('show');
    }

    hideError() {
        this.uploadError.classList.remove('show');
    }

    resetTool() {
        // 停止音频播放
        this.stopAudio();
        
        // 重置所有状态
        this.currentFile = null;
        this.audioBuffer = null;
        this.processedBlob = null;
        
        // 重置UI
        this.fileInfo.classList.remove('show');
        this.audioControls.classList.remove('show');
        this.processSection.classList.remove('show');
        this.progressContainer.classList.remove('show');
        this.downloadSection.classList.remove('show');
        
        // 重置步骤指示器
        Object.keys(this.steps).forEach(stepId => {
            this.steps[stepId].classList.remove('active', 'completed');
        });
        this.updateStepStatus('step1', 'active');
        
        // 重置sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('uploadSection').classList.add('active');
        
        // 重置控件
        this.volumeSlider.value = 100;
        this.updateVolumeDisplay(100);
        this.updatePresetButtons(100);
        this.playBtn.disabled = true;
        this.processBtn.disabled = true;
        
        // 清除音频元素
        this.audioElement.src = '';
        this.currentTimeSpan.textContent = '00:00';
        this.durationSpan.textContent = '00:00';
        
        // 重置波形显示
        this.waveformContainer.innerHTML = '<div class="waveform-placeholder">上传音频文件后显示波形</div>';
        
        // 重置文件输入
        this.fileInput.value = '';
        
        this.hideError();
    }
}

// 页面加载完成后初始化工具
document.addEventListener('DOMContentLoaded', () => {
    const audioTool = new AudioVolumeAdjuster();
    
    // 添加页面动画
    setTimeout(() => {
        document.querySelectorAll('.section').forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            setTimeout(() => {
                section.style.transition = 'all 0.6s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }, 100);
});