import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Clock, MapPin, Star, ArrowRight, ChevronDown, Users, CheckCircle, Smartphone, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";

// Import service images
import electricianImg from "@/assets/services/electrician.jpg";
import plumberImg from "@/assets/services/plumber.jpg";
import hvacImg from "@/assets/services/hvac.jpg";
import cleaningImg from "@/assets/services/cleaning.jpg";
import itImg from "@/assets/services/it.jpg";
import generalImg from "@/assets/services/general.jpg";
import heroBanner from "@/assets/hero-banner.jpg";
const services = [{
  image: electricianImg,
  title: "Eletricista",
  gradient: "from-yellow-500/80"
}, {
  image: plumberImg,
  title: "Canalizador",
  gradient: "from-blue-500/80"
}, {
  image: hvacImg,
  title: "Ar Condicionado",
  gradient: "from-cyan-500/80"
}, {
  image: cleaningImg,
  title: "Limpeza",
  gradient: "from-pink-500/80"
}, {
  image: itImg,
  title: "Informática",
  gradient: "from-purple-500/80"
}, {
  image: generalImg,
  title: "Outros",
  gradient: "from-primary/80"
}];
const features = [{
  icon: Shield,
  title: "Verificados",
  desc: "Todos os técnicos"
}, {
  icon: Clock,
  title: "Rápido",
  desc: "Em minutos"
}, {
  icon: MapPin,
  title: "Perto",
  desc: "Na sua região"
}, {
  icon: Star,
  title: "4.9★",
  desc: "Avaliação"
}];
const testimonials = [{
  name: "Maria Santos",
  role: "Cliente",
  text: "Serviço excelente! O técnico chegou em menos de 30 minutos.",
  rating: 5
}, {
  name: "João Pedro",
  role: "Técnico",
  text: "A plataforma mudou minha vida profissional. Recomendo!",
  rating: 5
}, {
  name: "Ana Costa",
  role: "Empresa",
  text: "Usamos para toda a nossa manutenção predial.",
  rating: 5
}];
export default function Landing() {
  const navigate = useNavigate();
  return <MobileLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section with Full Banner */}
        <div className="relative min-h-screen flex flex-col">
          {/* Hero Banner Image */}
          <div className="absolute inset-0">
            <img src={heroBanner} alt="Equipa de profissionais" className="w-full h-full object-cover" />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
          </div>

          {/* Animated Glow Effects */}
          <div className="absolute top-40 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-60 left-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] animate-pulse" style={{
          animationDelay: '1s'
        }} />

          {/* Header */}
          <motion.header initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="relative z-10 flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">Kilende</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="bg-background/50 backdrop-blur-sm border-border/50">
              Entrar
            </Button>
          </motion.header>

          {/* Main Hero Content */}
          <div className="flex-1 flex flex-col justify-center px-5 pb-20 relative z-10">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.1
          }} className="mb-4">
              <span className="inline-flex items-center gap-1.5 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-1.5 text-xs font-semibold text-primary shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                App #1 em Angola
              </span>
            </motion.div>

            <motion.h1 initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.2
          }} className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] mb-4 bg-[#f59f0a]/0">
              Serviços{" "}
              
              <br />na palma da mão
            </motion.h1>

            <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.3
          }} className="text-muted-foreground text-base mb-8 max-w-sm leading-relaxed">
              Conectamos você aos melhores técnicos certificados. 
              <span className="text-foreground font-medium"> Rápido, seguro e com garantia.</span>
            </motion.p>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.4
          }} className="flex flex-col gap-3">
              <Button size="lg" className="w-full gradient-primary text-primary-foreground text-lg py-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300" onClick={() => navigate("/register")}>
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full text-base py-6 rounded-2xl bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80" onClick={() => navigate("/register?role=technician")}>
                <Play className="mr-2 w-4 h-4" />
                Seja um Técnico
              </Button>
            </motion.div>

            {/* Stats Row */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.5
          }} className="grid grid-cols-4 gap-2 mt-10">
              {features.map((feat, i) => <div key={i} className="text-center group">
                  <div className="w-11 h-11 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center mx-auto mb-1.5 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300">
                    <feat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{feat.title}</p>
                  <p className="text-[10px] text-muted-foreground">{feat.desc}</p>
                </div>)}
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.8
        }} className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground mb-1">Explorar</span>
            <ChevronDown className="w-5 h-5 text-primary animate-bounce" />
          </motion.div>
        </div>

        {/* Services Section with Images */}
        <section className="px-5 py-12 bg-gradient-to-b from-card/50 to-background">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <span className="text-primary text-sm font-semibold">O que oferecemos</span>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2 mt-1">
              Nossos Serviços
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Encontre o profissional ideal para cada necessidade
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {services.map((service, index) => <motion.div key={index} initial={{
            opacity: 0,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: index * 0.08
          }} viewport={{
            once: true
          }} className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square" onClick={() => navigate("/register")}>
                {/* Service Image */}
                <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} via-transparent to-transparent opacity-60`} />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm font-bold text-foreground drop-shadow-lg">{service.title}</p>
                  <p className="text-[10px] text-muted-foreground">Ver técnicos →</p>
                </div>
                
                {/* Corner Accent */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-4 h-4 text-foreground" />
                </div>
              </motion.div>)}
          </div>
        </section>

        {/* How It Works - Premium Style */}
        <section className="px-5 py-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
          
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="relative">
            <span className="text-primary text-sm font-semibold">Simples e rápido</span>
            <h2 className="font-display text-2xl font-bold text-foreground mb-8 mt-1">
              Como Funciona
            </h2>

            <div className="space-y-6">
              {[{
              step: "01",
              title: "Escolha o Serviço",
              desc: "Selecione o tipo de serviço que precisa na nossa lista completa"
            }, {
              step: "02",
              title: "Descreva o Problema",
              desc: "Conte-nos detalhes do que precisa ser resolvido"
            }, {
              step: "03",
              title: "Receba o Técnico",
              desc: "Um profissional qualificado vai até você rapidamente"
            }].map((item, i) => <motion.div key={i} initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: i * 0.15
            }} viewport={{
              once: true
            }} className="flex items-start gap-4 group">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-primary-foreground font-display font-bold text-lg">{item.step}</span>
                    </div>
                    {i < 2 && <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent" />}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>)}
            </div>
          </motion.div>
        </section>

        {/* Testimonials Section */}
        <section className="px-5 py-12 bg-gradient-to-b from-background to-card/50">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <span className="text-primary text-sm font-semibold">Testemunhos</span>
            <h2 className="font-display text-2xl font-bold text-foreground mb-6 mt-1">
              O que dizem de nós
            </h2>
          </motion.div>

          <div className="space-y-4">
            {testimonials.map((testimonial, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1
          }} viewport={{
            once: true
          }} className="glass-card p-5 rounded-2xl border border-border/50">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-primary fill-primary" />)}
                </div>
                <p className="text-foreground text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>)}
          </div>
        </section>

        {/* Trust Section - Enhanced */}
        <section className="px-5 py-12">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} className="relative overflow-hidden rounded-3xl">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src={heroBanner} alt="Equipa" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-br from-card via-card/95 to-card" />
            </div>
            
            <div className="relative p-8 text-center">
              <div className="w-20 h-20 rounded-full gradient-primary mx-auto flex items-center justify-center mb-5 shadow-xl">
                <Users className="w-10 h-10 text-primary-foreground" />
              </div>
              <p className="font-display text-4xl font-bold text-foreground mb-1">+2.500</p>
              <p className="text-muted-foreground mb-6">Técnicos Verificados em Angola</p>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl bg-background/50 backdrop-blur-sm">
                  <p className="font-bold text-xl text-foreground">10K+</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 backdrop-blur-sm">
                  <p className="font-bold text-xl text-foreground">50K+</p>
                  <p className="text-xs text-muted-foreground">Serviços</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 backdrop-blur-sm">
                  <p className="font-bold text-xl text-foreground">4.9★</p>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA Section - Premium */}
        <section className="px-5 py-12 pb-24">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-center shadow-2xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <h2 className="font-display text-2xl font-bold text-primary-foreground mb-3">
                Pronto para começar?
              </h2>
              <p className="text-primary-foreground/80 text-sm mb-6 max-w-xs mx-auto">
                Junte-se a milhares de clientes satisfeitos em toda Angola
              </p>
              <Button size="lg" className="w-full bg-background text-foreground text-lg py-6 rounded-2xl hover:bg-background/90 shadow-xl" onClick={() => navigate("/register")}>
                <CheckCircle className="w-5 h-5 mr-2" />
                Criar Conta Grátis
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-5 py-8 bg-card/50 border-t border-border/50">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Kilende</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © 2024 Kilende. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </MobileLayout>;
}