> ## Documentation Index
> Fetch the complete documentation index at: https://platform.minimaxi.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# 音乐生成 (Music Generation)

> 使用本接口，输入歌词和歌曲描述，进行歌曲生成。



## OpenAPI

````yaml /api-reference/music/api/openapi.json POST /v1/music_generation
openapi: 3.1.0
info:
  title: MiniMax Music Generation API
  description: >-
    MiniMax music generation API with support for creating music from text
    prompts and lyrics
  license:
    name: MIT
  version: 1.0.0
servers:
  - url: https://api.minimaxi.com
security:
  - bearerAuth: []
paths:
  /v1/music_generation:
    post:
      tags:
        - Music
      summary: Music Generation
      operationId: generateMusic
      parameters:
        - name: Content-Type
          in: header
          required: true
          description: 请求体的媒介类型，请设置为 `application/json`，确保请求数据的格式为 JSON
          schema:
            type: string
            enum:
              - application/json
            default: application/json
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateMusicReq'
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GenerateMusicResp'
components:
  schemas:
    GenerateMusicReq:
      type: object
      required:
        - model
      properties:
        model:
          type: string
          description: 使用的模型名称，可选 `music-2.5+`（推荐）或 `music-2.5`
          enum:
            - music-2.5+
            - music-2.5
        prompt:
          type: string
          description: |-
            音乐的描述，用于指定风格、情绪和场景。例如“流行音乐, 难过, 适合在下雨的晚上”。<br>注意：
            - `music-2.5+` 纯音乐（`is_instrumental: true`）：必填，长度限制 [1, 2000] 个字符
            - `music-2.5` / `music-2.5+`（非纯音乐）：可选，长度限制 [0, 2000] 个字符
          maxLength: 2000
        lyrics:
          type: string
          description: >-
            歌曲歌词，使用 `\n` 分隔每行。支持结构标签：`[Intro]`, `[Verse]`, `[Pre Chorus]`,
            `[Chorus]`, `[Interlude]`, `[Bridge]`, `[Outro]`, `[Post Chorus]`,
            `[Transition]`, `[Break]`, `[Hook]`, `[Build Up]`, `[Inst]`,
            `[Solo]`。

            <br>

            注意：

            - `music-2.5+` 纯音乐（`is_instrumental: true`）：非必填

            - `music-2.5` / `music-2.5+`（非纯音乐）：必填，长度限制 [1, 3500] 个字符

            - 当 `lyrics_optimizer: true` 且 `lyrics` 为空时，系统将根据 `prompt` 自动生成歌词
          minLength: 1
          maxLength: 3500
        stream:
          type: boolean
          description: 是否使用流式传输，默认为 `false`
          default: false
        output_format:
          type: string
          description: >-
            音频的返回格式，可选值为 `url` 或 `hex`，默认为 `hex`。当 `stream` 为 `true` 时，仅支持 `hex`
            格式。注意：url 的有效期为 24 小时，请及时下载
          enum:
            - url
            - hex
          default: hex
        audio_setting:
          $ref: '#/components/schemas/AudioSetting'
        aigc_watermark:
          type: boolean
          description: '是否在音频末尾添加水印，默认为 `false`。仅在非流式 (`stream: false`) 请求时生效'
        lyrics_optimizer:
          type: boolean
          description: |-
            是否根据 `prompt` 描述自动生成歌词。仅 `music-2.5` 和 `music-2.5+` 支持。

            设为 `true` 且 `lyrics` 为空时，系统会根据 prompt 自动生成歌词。默认为 `false`
          default: false
        is_instrumental:
          type: boolean
          description: |-
            是否生成纯音乐（无人声）。仅 `music-2.5+` 支持。

            设为 `true` 时，`lyrics` 字段非必填。默认为 `false`
          default: false
      example:
        model: music-2.5+
        prompt: 独立民谣,忧郁,内省,渴望,独自漫步,咖啡馆
        lyrics: |-
          [verse]
          街灯微亮晚风轻抚
          影子拉长独自漫步
          旧外套裹着深深忧郁
          不知去向渴望何处
          [chorus]
          推开木门香气弥漫
          熟悉的角落陌生人看
        audio_setting:
          sample_rate: 44100
          bitrate: 256000
          format: mp3
    GenerateMusicResp:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/MusicData'
        base_resp:
          $ref: '#/components/schemas/BaseResp'
      example:
        data:
          audio: hex编码的音频数据
          status: 2
        trace_id: 04ede0ab069fb1ba8be5156a24b1e081
        extra_info:
          music_duration: 25364
          music_sample_rate: 44100
          music_channel: 2
          bitrate: 256000
          music_size: 813651
        analysis_info: null
        base_resp:
          status_code: 0
          status_msg: success
    AudioSetting:
      type: object
      description: 音频输出配置
      properties:
        sample_rate:
          type: integer
          description: 采样率。可选值：`16000`, `24000`, `32000`, `44100`
        bitrate:
          type: integer
          description: 比特率。可选值：`32000`, `64000`, `128000`, `256000`
        format:
          type: string
          description: 音频编码格式。
          enum:
            - mp3
            - wav
            - pcm
    MusicData:
      type: object
      properties:
        status:
          type: integer
          description: |-
            音乐合成状态：
            1: 合成中
            2: 已完成
        audio:
          type: string
          description: 当 `output_format` 为 `hex` 时返回，是音频文件的 16 进制编码字符串
    BaseResp:
      type: object
      description: 状态码及详情
      properties:
        status_code:
          type: integer
          description: |-
            状态码及其分别含义如下：

            `0`: 请求成功

            `1002`: 触发限流，请稍后再试

            `1004`: 账号鉴权失败，请检查 API-Key 是否填写正确

            `1008`: 账号余额不足

            `1026`: 图片描述涉及敏感内容

            `2013`: 传入参数异常，请检查入参是否按要求填写

            `2049`: 无效的api key

            更多内容可查看 [错误码查询列表](/api-reference/errorcode) 了解详情
        status_msg:
          type: string
          description: 具体错误详情
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |-
        `HTTP: Bearer Auth`
         - Security Scheme Type: http
         - HTTP Authorization Scheme: Bearer API_key，用于验证账户信息，可在 [账户管理>接口密钥](https://platform.minimaxi.com/user-center/basic-information/interface-key) 中查看。

````




> ## Documentation Index
> Fetch the complete documentation index at: https://platform.minimaxi.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# 上传复刻音频

> 使用本接口上传用于复刻的音频文件。



## OpenAPI

````yaml /api-reference/speech/voice-cloning/api/upload-file.json POST /v1/files/upload
openapi: 3.1.0
info:
  title: MiniMax Voice Cloning API
  description: MiniMax Voice Cloning API with support for voice cloning and file upload
  license:
    name: MIT
  version: 1.0.0
servers:
  - url: https://api.minimaxi.com
security:
  - bearerAuth: []
paths:
  /v1/files/upload:
    post:
      tags:
        - Files
      summary: Upload File
      operationId: uploadFile
      parameters:
        - name: Content-Type
          in: header
          required: true
          description: '请求体的媒介类型 `multipart/form-data` '
          schema:
            type: string
            enum:
              - multipart/form-data
            default: multipart/form-datan
      requestBody:
        description: ''
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - purpose
                - file
              properties:
                purpose:
                  type: string
                  description: |-
                    文件使用目的。取值及支持格式如下：
                    - `voice_clone`: 快速复刻原始文件，（支持mp3、m4a、wav格式）
                  default: voice_clone
                  enum:
                    - voice_clone
                  example: voice_clone
                file:
                  type: string
                  format: binary
                  description: |-
                    需要上传的文件。填写文件的路径地址 

                    支持上传的文件需遵从以下规范：
                    - 上传的音频文件格式需为：mp3、m4a、wav格式
                    - 上传的音频文件的时长最少应不低于10秒，最长应不超过5分钟
                    - 上传的音频文件大小需不超过20mb
        required: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UploadFileResp'
components:
  schemas:
    UploadFileResp:
      type: object
      properties:
        file:
          $ref: '#/components/schemas/FileObject'
        base_resp:
          $ref: '#/components/schemas/UploadFileBaseResp'
      example:
        file:
          file_id: ${file_id}
          bytes: 5896337
          created_at: 1700469398
          filename: 复刻音频
          purpose: voice_clone
        base_resp:
          status_code: 0
          status_msg: success
    FileObject:
      type: object
      properties:
        file_id:
          type: integer
          format: int64
          description: 文件的唯一标识符
        bytes:
          type: integer
          format: int64
          description: 文件大小，以字节为单位
        created_at:
          type: integer
          format: int64
          description: 创建文件时的 Unix 时间戳，以秒为单位
        filename:
          type: string
          description: 文件的名称
        purpose:
          type: string
          description: 文件的使用目的
          enum:
            - voice_clone
    UploadFileBaseResp:
      type: object
      properties:
        status_code:
          type: integer
          description: |-
            状态码及其分别含义如下：
            - 0，请求成功
            - 1002，触发限流，请稍后再试
            - 1004，账号鉴权失败，请检查 API-Key 是否填写正确
            - 1008，账号余额不足
            - 1026，图片描述涉及敏感内容
            - 2013，传入参数异常，请检查入参是否按要求填写
            - 2049，无效的api key

            更多内容可查看错误码查询列表了解详情
        status_msg:
          type: string
          description: 状态详情
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |-
        `HTTP: Bearer Auth`
         - Security Scheme Type: http
         - HTTP Authorization Scheme: Bearer API_key，用于验证账户信息，可在 [账户管理>接口密钥](https://platform.minimaxi.com/user-center/basic-information/interface-key) 中查看。

````