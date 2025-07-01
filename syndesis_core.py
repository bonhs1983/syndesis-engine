import numpy as np
import json
import os
from typing import List, Dict, Any

class MemoryEngine:
    def __init__(self, backend: str = 'json', filename: str = 'syndesis_memory.json'):
        self.backend = backend
        self.filename = filename
        if os.path.exists(self.filename) and self.backend == 'json':
            with open(self.filename, 'r', encoding='utf-8') as f:
                self.store_data = json.load(f)
        else:
            self.store_data = {'messages': [], 'threads': {}, 'restore_points': {}}
            self._save()

    def _save(self):
        if self.backend == 'json':
            with open(self.filename, 'w', encoding='utf-8') as f:
                json.dump(self.store_data, f, ensure_ascii=False, indent=2)

    def store(self, message: str, metrics: Dict[str, Any]):
        entry = {'message': message, 'metrics': metrics}
        self.store_data['messages'].append(entry)
        self._save()

    def get_messages(self) -> List[Dict[str, Any]]:
        return self.store_data['messages']

    def clear(self):
        self.store_data = {'messages': [], 'threads': {}, 'restore_points': {}}
        self._save()

    def get_threads(self) -> List[str]:
        return list(self.store_data['threads'].keys())

    def add_thread(self, name: str, vector: List[float]):
        self.store_data['threads'][name] = vector
        self._save()

class IntentParser:
    def parse(self, message: str) -> np.ndarray:
        words = message.lower().split()
        vec = np.zeros(len(words))
        for i in range(len(words)):
            vec[i] = 1.0
        return vec

class EmotionTracker:
    def __init__(self, alpha: float = 0.8):
        self.alpha = alpha
        self.Es_prev = 0.0

    def update(self, delta_e: float) -> float:
        self.Es_prev = self.alpha * self.Es_prev + (1 - self.alpha) * delta_e
        return self.Es_prev

class ThreadMatcher:
    def match(self, q_t: np.ndarray, threads: List[np.ndarray]) -> float:
        if not threads:
            return 0.0
        sims = [np.dot(q_t, t_i) / (np.linalg.norm(q_t) * np.linalg.norm(t_i)) for t_i in threads]
        return float(np.mean(sims))

class ForceFieldModel:
    def __init__(self, k: float = 1.0):
        self.k = k

    def compute(self, q_i: float, q_j: float, d_ij: float) -> float:
        if d_ij == 0:
            return 0.0
        return self.k * q_i * q_j / (d_ij ** 2)

class SyndesisCore:
    def __init__(self, config: Dict[str, Any] = None):
        config = config or {}
        self.memory_engine = MemoryEngine(backend=config.get('memory_backend', 'json'))
        self.intent_parser = IntentParser()
        self.emotion_tracker = EmotionTracker(alpha=config.get('emotion_alpha', 0.8))
        self.thread_matcher = ThreadMatcher()
        self.force_field = ForceFieldModel(k=config.get('force_constant', 1.0))
        self.state = {'Sa': 0.0, 'Id': 0.0, 'Es': 0.0, 'Tc': 0.0}

    def self_alignment(self, g_u: np.ndarray, r_a: np.ndarray) -> float:
        norm_gu = np.linalg.norm(g_u)
        if norm_gu == 0:
            return 0.0
        deviation = np.linalg.norm(g_u - r_a)
        self.state['Sa'] = float(1 - deviation / norm_gu)
        return self.state['Sa']

    def intent_deviation(self, i_true: np.ndarray, i_detected: np.ndarray) -> float:
        self.state['Id'] = float(np.linalg.norm(i_true - i_detected))
        return self.state['Id']

    def emotional_tracking(self, delta_e: float) -> float:
        self.state['Es'] = self.emotion_tracker.update(delta_e)
        return self.state['Es']

    def thread_correlation(self, q_t: np.ndarray, threads: List[np.ndarray]) -> float:
        self.state['Tc'] = self.thread_matcher.match(q_t, threads)
        return self.state['Tc']

    def field_of_forces(self, q_i: float, q_j: float, d_ij: float) -> float:
        return self.force_field.compute(q_i, q_j, d_ij)

    def process_message(self, message: str) -> Dict[str, Any]:
        intent_vec = self.intent_parser.parse(message)
        true_intent = intent_vec
        response_vec = intent_vec
        sa = self.self_alignment(true_intent, response_vec)
        idv = self.intent_deviation(true_intent, intent_vec)
        delta_e = np.random.uniform(-1, 1)
        es = self.emotional_tracking(delta_e)

        # prepare thread vectors, align lengths
        threads_data = self.memory_engine.store_data.get('threads', {})
        threads_vecs = []
        for v in threads_data.values():
            arr = np.array(v)
            if arr.shape[0] < intent_vec.shape[0]:
                pad = np.zeros(intent_vec.shape[0] - arr.shape[0])
                arr = np.concatenate([arr, pad])
            elif arr.shape[0] > intent_vec.shape[0]:
                arr = arr[:intent_vec.shape[0]]
            threads_vecs.append(arr)

        tc = self.thread_correlation(intent_vec, threads_vecs)
        metrics = {'Sa': sa, 'Id': idv, 'Es': es, 'Tc': tc}
        self.memory_engine.store(message, metrics)
        return {
            'metrics': self.state.copy(),
            'reply': f"Metrics updated: Sa={sa:.2f}, Id={idv:.2f}, Es={es:.2f}, Tc={tc:.2f}"
        }

if __name__ == '__main__':
    core = SyndesisCore()
    print("SYNDESIS Core Initialized. Type commands or 'exit' to quit.")
    while True:
        inp = input('>> ')
        cmd = inp.strip().lower()

        if cmd == 'exit':
            break

        elif cmd == 'list':
            print(json.dumps(core.memory_engine.get_messages(),
                             ensure_ascii=False,
                             indent=2))
            continue

        elif cmd == 'threads':
            print(core.memory_engine.get_threads())
            continue

        elif cmd.startswith('thread add '):
            name = inp[len('thread add '):].strip()
            vec = core.intent_parser.parse(name).tolist()
            core.memory_engine.add_thread(name, vec)
            print(f"Thread '{name}' added.")
            continue

        elif cmd == 'clear':
            core.memory_engine.clear()
            print("Memory cleared.")
            continue

        result = core.process_message(inp)
        print('Syndesis:', result['reply'])

    print('Session ended.')
