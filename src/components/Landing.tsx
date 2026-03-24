import { Store, ShieldCheck, Zap, BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingProps {
  onAuth: () => void;
}

export default function Landing({ onAuth }: LandingProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-8 h-8 text-green-600" />
          <span className="font-bold text-2xl text-gray-900">SavdoPlus</span>
        </div>
        <button 
          onClick={onAuth}
          className="bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          Войти
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            Простое управление <br />
            <span className="text-green-600">вашим магазином</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            SavdoPlus помогает владельцам малых магазинов в Узбекистане вести учет товаров, продаж и остатков без лишних сложностей.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onAuth}
              className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
            >
              Начать бесплатно <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all">
              Посмотреть демо
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={Zap}
              title="Быстрые продажи"
              description="Оформляйте продажи за считанные секунды. Автоматическое списание остатков."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Надежный учет"
              description="Забудьте про тетради. Все данные хранятся в облаке и доступны в любое время."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Простая аналитика"
              description="Следите за выручкой и популярными товарами через наглядные отчеты."
            />
          </div>
        </div>
      </section>

      {/* FAQ Placeholder */}
      <section className="py-24 max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-12">Часто задаваемые вопросы</h2>
        <div className="space-y-6 text-left">
          <FAQItem question="Это сложно?" answer="Нет, SavdoPlus создан специально для тех, кто не дружит с технологиями." />
          <FAQItem question="Работает ли на телефоне?" answer="Да, приложение полностью адаптировано под мобильные устройства." />
        </div>
      </section>

      <footer className="py-12 border-t text-center text-gray-500 text-sm">
        &copy; 2026 SavdoPlus. Сделано для малого бизнеса в Узбекистане.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-6 h-6 text-green-600" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }: any) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100">
      <h4 className="font-bold text-gray-900 mb-2">{question}</h4>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}
