@startuml

title WebArcs Diagram

Arc o-- Particle

class Arc << (A, orchid) >> {
    + update()
    + addParticle()
    + getParticleById()
    + onchange()
}

class Particle << (P, #FF7700) >> {
    + get config
    + update()
    + onoutput()
}

@enduml
