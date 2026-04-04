import os
import json
from dotenv import load_dotenv
from minimax_client import MiniMaxClient

def test_connection():
    load_dotenv()
    
    group_id = os.getenv("MINIMAX_GROUP_ID")
    api_key = os.getenv("MINIMAX_API_KEY")
    
    print("=== 0xRIP 灵魂引擎诊断系统 ===")
    print(f"Group ID: {group_id if group_id else '未配置'}")
    print(f"API Key: {'已配置 (前4位: ' + api_key[:4] + '...)' if api_key else '未配置'}")
    
    if not group_id or not api_key:
        print("\n❌ 错误: 请先在 backend/.env 文件中配置 MINIMAX_GROUP_ID 和 MINIMAX_API_KEY")
        return

    client = MiniMaxClient()
    
    # 1. 测试招魂对话 (Chat)
    print("\n[1/3] 正在尝试召唤幽灵对话...")
    bot_setting = {
        "bot_name": "测试幽灵",
        "content": "你是一个在 0xRIP 墓地中进行连接测试的幽灵。请用简短且带有赛博感的话回答：'连接已建立'。"
    }
    messages = [{"role": "user", "sender_type": "USER", "sender_name": "Visitor", "text": "你在吗？"}]
    
    try:
        chat_res = client.summon_ghost(messages, bot_setting)
        if "choices" in chat_res:
            reply = chat_res['choices'][0]['message']['content']
            print(f"✅ 对话连接成功! 幽灵回应: {reply}")
        else:
            print(f"❌ 对话连接失败: {json.dumps(chat_res, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ 对话请求发生异常: {str(e)}")

    # 2. 测试语音合成 (T2S)
    print("\n[2/3] 正在尝试合成幽灵语音...")
    try:
        voice_res = client.generate_voice("0xRIP 灵魂同步中")
        # 检查是否返回了 base64 或二进制数据 (MiniMax V2 返回 json 中包含 base64)
        if "data" in voice_res or "base64" in str(voice_res):
            print("✅ 语音合成成功! 已接收到音频流数据。")
        else:
            print(f"❌ 语音合成失败: {json.dumps(voice_res, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ 语音请求发生异常: {str(e)}")

    # 3. 测试视频生成接口 (Video-01)
    print("\n[3/3] 正在验证视频生成接口...")
    try:
        # 视频生成较贵且慢，我们只测试接口是否能正确识别 prompt
        video_res = client.generate_video("Test ghost figure")
        if "task_id" in video_res or "base_resp" in video_res:
             # 如果返回 status_code 0 表示请求已接受
            status = video_res.get("base_resp", {}).get("status_code", -1)
            if status == 0 or "task_id" in video_res:
                print(f"✅ 视频生成接口验证成功! Task ID: {video_res.get('task_id', 'N/A')}")
            else:
                print(f"❌ 视频接口返回错误: {video_res}")
        else:
            print(f"❌ 视频接口连接异常: {video_res}")
    except Exception as e:
        print(f"❌ 视频请求发生异常: {str(e)}")

if __name__ == "__main__":
    test_connection()
