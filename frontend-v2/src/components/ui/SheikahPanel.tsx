import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store/useStore'
import { ChatView } from './ChatView'

export const SheikahPanel = () => {
  const { 
    lang, setLang, 
    panelExpanded, togglePanel, 
    selectedGrave, selectGrave,
    graves, toggleAutoRotate,
    isChatOpen, setChatOpen, clearMessages, addMessage
  } = useStore()

  const t = {
    panelTitle: lang === 'en' ? 'Sheikah Slate' : '希卡石板',
    monuments: lang === 'en' ? 'Monuments' : '纪念碑',
    selected: lang === 'en' ? 'Selected' : '已选择',
    actions: lang === 'en' ? 'Actions' : '操作',
    selectMonument: lang === 'en' ? 'Select a monument' : '选择一个纪念碑',
    upload: lang === 'en' ? 'Upload' : '上传',
    summon: lang === 'en' ? 'Summon' : '召唤',
    reset: lang === 'en' ? 'Reset View' : '重置视角',
    rotate: lang === 'en' ? 'Auto Rotate' : '自动旋转',
    systemSummon: lang === 'en' ? 'Neural Link Established.' : '神经连接已建立。',
  }

  const handleSummon = () => {
    if (!selectedGrave) return;
    clearMessages();
    addMessage({ role: 'system', content: `${t.systemSummon} [ID: ${selectedGrave.id}]` });
    setChatOpen(true);
  }

  return (
    <motion.div 
      initial={false}
      animate={{ y: panelExpanded ? 0 : 'calc(100% - 70px)' }}
      transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[20px] border-t border-mv-gray-light z-50 flex flex-col"
    >
      {/* Handle */}
      <div 
        onClick={togglePanel}
        className="h-[70px] flex items-center justify-center cursor-pointer border-b border-mv-gray-light relative group shrink-0"
      >
        <div className="w-10 h-[3px] bg-mv-gray rounded-sm group-hover:bg-sheikah-blue transition-colors" />
        
        {/* Eye Icon */}
        <div className={`absolute left-10 w-8 h-8 border-2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] transition-all flex items-center justify-center ${panelExpanded ? 'border-sheikah-blue shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'border-mv-gray-dark'}`}>
          <div className={`w-1.5 h-1.5 rounded-full transition-all ${panelExpanded ? 'bg-sheikah-blue' : 'bg-mv-charcoal'}`} />
        </div>

        <div className="font-serif italic text-mv-text-dim ml-4">{t.panelTitle}</div>

        {/* Lang Switcher */}
        <div className="absolute right-10 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 text-[11px] rounded border transition-colors ${lang === 'en' ? 'bg-mv-charcoal text-white border-mv-charcoal hover:bg-sheikah-blue hover:border-sheikah-blue' : 'border-mv-gray-light hover:text-sheikah-blue hover:border-sheikah-blue'}`}
          >
            EN
          </button>
          <div className="w-px h-4 bg-mv-gray-light" />
          <button 
            onClick={() => setLang('zh')}
            className={`px-3 py-1.5 text-[11px] rounded border transition-colors ${lang === 'zh' ? 'bg-mv-charcoal text-white border-mv-charcoal hover:bg-sheikah-blue hover:border-sheikah-blue' : 'border-mv-gray-light hover:text-sheikah-blue hover:border-sheikah-blue'}`}
          >
            中
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[480px] flex">
        {/* Section 1: List (Always visible, takes 1/4 width to give chat more space) */}
        <div className="w-1/4 p-6 border-r border-mv-gray-light overflow-y-auto shrink-0 bg-mv-bg/30">
          <SectionHeader title={t.monuments} />
          <div className="flex flex-col gap-2.5">
            {graves.map(g => (
              <div 
                key={g.id}
                onClick={() => {
                  selectGrave(g)
                  if (isChatOpen) setChatOpen(false) // Close chat if switching grave
                }}
                className={`flex items-center gap-3 p-3.5 rounded-md border cursor-pointer transition-all ${selectedGrave?.id === g.id ? 'bg-white border-sheikah-blue shadow-[0_2px_12px_rgba(0,212,255,0.1)]' : 'bg-white border-transparent hover:border-sheikah-blue hover:shadow-sm'}`}
              >
                <div className={`w-2 h-2 rounded-full transition-all shrink-0 ${selectedGrave?.id === g.id ? 'bg-sheikah-blue shadow-[0_0_8px_#00d4ff]' : 'bg-mv-gray group-hover:bg-sheikah-blue'}`} />
                <div className="min-w-0">
                  <div className="font-serif text-[15px] text-mv-charcoal truncate">{g.name}</div>
                  <div className="text-[9px] text-mv-text-dim opacity-70 mt-0.5">{g.id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Right Section (Takes 3/4 width) */}
        <div className="w-3/4 flex relative overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            {isChatOpen ? (
              <ChatView key="chat" />
            ) : (
              <motion.div 
                key="details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex"
              >
                {/* Section 2: Detail (Takes remaining half) */}
                <div className="w-1/2 p-6 border-r border-mv-gray-light overflow-y-auto flex flex-col">
                  <SectionHeader title={t.selected} />
                  <AnimatePresence mode="wait">
                    {selectedGrave ? (
                      <motion.div 
                        key={selectedGrave.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white border border-mv-gray-light rounded-lg p-6 shadow-sm flex-1"
                      >
                        <div className="text-[10px] tracking-widest text-sheikah-blue mb-2 font-mono">{selectedGrave.id}</div>
                        <div className="font-serif text-3xl text-mv-charcoal mb-4 leading-tight">{selectedGrave.name}</div>
                        <div className="text-sm text-mv-text-dim italic leading-relaxed p-4 bg-mv-bg rounded border-l-2 border-mv-gray-light">
                          "{selectedGrave.epitaph}"
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="m-auto text-center py-10 text-mv-gray"
                      >
                        <div className="text-4xl mb-4 opacity-50">🪦</div>
                        <div className="text-xs tracking-wider uppercase">{t.selectMonument}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Section 3: Actions (Takes remaining half) */}
                <div className="w-1/2 p-6 overflow-y-auto">
                  <SectionHeader title={t.actions} />
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <ActionBtn>{t.upload}</ActionBtn>
                    <ActionBtn primary onClick={handleSummon}>{t.summon}</ActionBtn>
                    <ActionBtn onClick={() => selectGrave(null)}>{t.reset}</ActionBtn>
                    <ActionBtn onClick={toggleAutoRotate}>{t.rotate}</ActionBtn>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2 mb-4 text-[10px] tracking-[0.2em] uppercase text-mv-text-dim">
    <div className="w-1.5 h-1.5 rounded-full bg-sheikah-blue" />
    {title}
  </div>
)

const ActionBtn = ({ children, primary, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-md text-[10px] tracking-widest uppercase transition-all border ${primary ? 'bg-mv-charcoal text-white border-mv-charcoal hover:bg-sheikah-blue hover:border-sheikah-blue hover:shadow-[0_0_10px_#00d4ff]' : 'bg-white text-mv-text-dim border-mv-gray-light hover:text-sheikah-blue hover:border-sheikah-blue'}`}
  >
    {children}
  </button>
)
