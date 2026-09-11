from localops.orchestration.graph import Agent
from localops.rag.retriever import Retriever
from localops.store import Store
from localops.tools.registry import ToolRegistry
from localops.voice.service import VoiceService


class Services:
    def __init__(self, settings):
        self.settings = settings
        self.store = Store(settings.data_dir / "localops.db")
        self.retriever = Retriever(self.store, settings)
        self.registry = ToolRegistry(self.store)
        self.agent = Agent(self.store, self.retriever, self.registry, settings)
        self.voice = VoiceService(settings)

    def close(self):
        self.agent.close()
        self.retriever.close()
