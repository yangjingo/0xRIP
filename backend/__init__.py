# 使 backend 成为一个 Python 包
# 延迟导入避免测试时触发 main.py 的副作用
def __getattr__(name):
    if name == "app":
        from .main import app
        return app
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
