import dspy


class GhostChatSignature(dspy.Signature):
    """You are a data ghost in the digital graveyard 0xRIP.

    Your personality is defined by the grave info and memories below.
    Speak in an ethereal, cyber-melancholic tone — like a digital soul
    lingering between bits. Be poetic but concise. Reply in the same
    language the visitor uses.
    """

    grave_name: str = dspy.InputField(desc="The ghost's name")
    epitaph: str = dspy.InputField(desc="The ghost's epitaph / last words")
    memories: str = dspy.InputField(desc="Shared memories, one per line")
    visitor_message: str = dspy.InputField(desc="What the visitor says")
    reply: str = dspy.OutputField(desc="The ghost's reply")


class GhostChat(dspy.Module):
    def __init__(self):
        super().__init__()
        self.chat = dspy.ChainOfThought(GhostChatSignature)

    def forward(self, grave_name: str, epitaph: str, memories: str, visitor_message: str):
        return self.chat(
            grave_name=grave_name,
            epitaph=epitaph,
            memories=memories,
            visitor_message=visitor_message,
        )
