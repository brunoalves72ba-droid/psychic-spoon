// Formação IA Generativa — © Bruno Moura, único e exclusivo proprietário.
// Roda o código num espaço de nomes novo. input() lê da lista de entradas; com eco, mostra a pergunta e a resposta.
export const HARNESS = `
import sys, json
_entradas = json.loads(_ent)
def _input(prompt=''):
    if _eco:
        print(prompt, end='')
    if not _entradas:
        raise EOFError('o programa pediu mais input() do que as entradas fornecidas')
    v = _entradas.pop(0)
    if _eco:
        print(v)
    return v
_ns = {'__name__': '__main__', 'input': _input}
_res = 'ok'
_depr = ''
try:
    exec(_src, _ns)
    if _dep:
        _depr = 'sim' if eval(_dep, _ns) else 'nao'
except Exception as e:
    _res = 'erro'
    sys.print_exception(e)
`;

