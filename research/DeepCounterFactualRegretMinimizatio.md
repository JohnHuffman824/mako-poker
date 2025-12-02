Abstract
Counterfactual Regret Minimization (CFR)is the
leading framework for solving large imperfect-
information games. It converges to an equilibrium
by iteratively traversing the game tree. In order
to deal with extremely large games, abstraction
is typically applied before running CFR. The ab-
stracted game is solved with tabular CFR, and its
solution is mapped back to the full game. This
process can be problematic because aspects of
abstraction are often manual and domain specific,
abstraction algorithms may miss important strate-
gic nuances of the game, and there is a chicken-
and-egg problem because determining a good ab-
straction requires knowledge of the equilibrium
of the game. This paper introducesDeep Counter-
factual Regret Minimization, a form of CFR that
obviates the need for abstraction by instead using
deep neural networks to approximate the behavior
of CFR in the full game. We show that Deep CFR
is principled and achieves strong performance in
large poker games. This is the first non-tabular
variant of CFR to be successful in large games.
1. Introduction
Imperfect-information games model strategic interactions
between multiple agents with only partial information. They
are widely applicable to real-world domains such as negoti-
ations, auctions, and cybersecurity interactions. Typically
in such games, one wishes to find an approximate equilib-
rium in which no player can improve by deviating from the
equilibrium.

The most successful family of algorithms for imperfect-
information games have been variants ofCounterfactual
Regret Minimization (CFR)(Zinkevich et al., 2007). CFR is
an iterative algorithm that converges to a Nash equilibrium

*Equal contribution (^1) Facebook AI Research (^2) Computer Science
Department, Carnegie Mellon University^3 Strategic Machine Inc.,
Strategy Robot Inc., and Optimized Markets Inc. Correspondence
to: Noam Brownnoamb@cs.cmu.edu.
Proceedings of the 36 thInternational Conference on Machine
Learning, Long Beach, California, PMLR 97, 2019. Copyright
2019 by the author(s).
in two-player zero-sum games. Forms of tabular CFR have
been used in all recent milestones in the benchmark domain
of poker (Bowling et al., 2015; Moravˇc ́ık et al., 2017; Brown
& Sandholm, 2017) and have been used in all competitive
agents in the Annual Computer Poker Competition going
back at least six years.^1 In order to deal with extremely
large imperfect-information games,abstractionis typically
used to simplify a game by bucketing similar states together
and treating them identically. The simplified (abstracted)
game is approximately solved via tabular CFR. However,
constructing an effective abstraction requires extensive do-
main knowledge and the abstract solution may only be a
coarse approximation of a true equilibrium.
In constrast, reinforcement learning has been successfully
extended to large state spaces by using function approx-
imation with deep neural networks rather than a tabular
representation of the policy (deep RL). This approach has
led to a number of recent breakthroughs in constructing
strategies in large MDPs (Mnih et al., 2015) as well as in
zero-sum perfect-information games such as Go (Silver
et al., 2017; 2018).^2 Importantly, deep RL can learn good
strategies with relatively little domain knowledge for the
specific game (Silver et al., 2017). However, most popular
RL algorithms do not converge to good policies (equilibria)
in imperfect-information games in theory or in practice.
Rather than use tabular CFR with abstraction, this paper
introduces a form of CFR, which we refer to asDeep Coun-
terfactual Regret Minimization, that uses function approx-
imation with deep neural networks to approximate the be-
havior of tabular CFR on the full, unabstracted game. We
prove that Deep CFR converges to an-Nash equilibrium
in two-player zero-sum games and empirically evaluate per-
formance in poker variants, including heads-up limit Texas
hold’em. We show Deep CFR outperforms Neural Ficti-
tious Self Play (NFSP) (Heinrich & Silver, 2016), which
was the prior leading function approximation algorithm for
imperfect-information games, and that Deep CFR is com-
petitive with domain-specific tabular abstraction techniques.
(^1) http://www.computerpokercompetition.org
(^2) Deep RL has also been applied successfully to some partially
observed games such as Doom (Lample & Chaplot, 2017), as long
as the hidden information is not too strategically important.

2. Notation and Background
In an imperfect-information extensive-form (that is, tree-
form) game there is a finite set of players,P. Anode
(or history)his defined by all information of the current
situation, including private knowledge known to only one
player. A(h)denotes the actions available at a node and
P(h)is either chance or the unique player who acts at that
node. If actiona∈A(h)leads fromhtoh′, then we write
h·a=h′. We writeh@h′if a sequence of actions leads
fromhtoh′.His the set of all nodes.Z⊆Hare terminal
nodes for which no actions are available. For each player
p∈ P, there is a payoff functionup:Z→R. In this
paper we assumeP={ 1 , 2 }andu 1 =−u 2 (the game is
two-player zero-sum). We denote the range of payoffs in
the game by∆.

Imperfect information is represented byinformation sets
(infosets) for each playerp∈ P. For any infosetIbe-
longing top, all nodesh,h′∈Iare indistinguishable to
p. Moreover, every non-terminal nodeh∈Hbelongs to
exactly one infoset for eachp. We represent the set of all
infosets belonging topwherepacts byIp. We call the
set of all terminal nodes with a prefix inIasZI, and we
call the particular prefixz[I]. We assume the game features
perfect recall, which means ifhandh′do not share a player
pinfoset then all nodes followinghdo not share a playerp
infoset with any node followingh′.

A strategy (or policy)σ(I)is a probability vector over ac-
tions for acting playerpin infosetI. Since all states in an
infoset belonging topare indistinguishable, the strategies
in each of them must be identical. The set of actions inIis
denoted byA(I). The probability of a particular actionais
denoted byσ(I,a). We defineσpto be a strategy forpin
every infoset in the game wherepacts. A strategy profileσ
is a tuple of strategies, one for each player. The strategy of
every player other thanpis represented asσ−p.up(σp,σ−p)
is the expected payoff forpif playerpplays according to
σpand the other players play according toσ−p.

πσ(h) = Πh′·avhσP(h′)(h′,a)is calledreachand is the
probabilityhis reached if all players play according toσ.
πσp(h)is the contribution ofpto this probability.π−σp(h)
is the contribution of chance and all players other thanp.
For an infosetIbelonging top, the probability of reaching
Iifpchooses actions leading towardIbut chance and all
players other thanpplay according toσ−pis denoted by
πσ−p(I) =

∑
h∈Iπ
σ
−p(h). Forhvz, defineπ
σ(h→z) =
Πh′·avz,h′ 6 @hσP(h′)(h′,a)

Abest responsetoσ−pis a playerpstrategyBR(σ−p)
such thatup

(
BR(σ−p),σ−p
)
= maxσ′pup(σ′p,σ−p). A
Nash equilibrium σ∗ is a strategy profile where ev-
eryone plays a best response: ∀p, up(σ∗p,σ∗−p) =
maxσ′pup(σ′p,σ∗−p)(Nash, 1950). Theexploitabilitye(σp)

of a strategyσpin a two-player zero-sum game is how much
worseσpdoes versusBR(σp)compared to how a Nash
equilibrium strategyσp∗does againstBR(σ∗p). Formally,
e(σp) =up
(
σ∗p,BR(σp∗)
)
−up
(
σp,BR(σp)
)
. We mea-
suretotal exploitability

∑
p∈Pe(σp)
(^3).
2.1. Counterfactual Regret Minimization (CFR)
CFR is an iterative algorithm that converges to a Nash equi-
librium in any finite two-player zero-sum game with a the-
oretical convergence bound ofO(√^1 T). In practice CFR
converges much faster. We provide an overview of CFR be-
low; for a full treatment, see Zinkevich et al. (2007). Some
recent forms of CFR converge inO(T 01. 75 )in self-play set-
tings (Farina et al., 2019), but are slower in practice so we
do not use them in this paper.
Letσtbe the strategy profile on iterationt. Thecounter-
factual valuevσ(I)of playerp=P(I)atIis the expected
payoff topwhen reachingI, weighted by the probability
thatpwould reachedIif she tried to do so that iteration.
Formally,
vσ(I) =

∑
z∈ZI
π−σp(z[I])πσ(z[I]→z)up(z) (1)
andvσ(I,a)is the same except it assumes that playerp
plays actionaat infosetIwith 100% probability.
Theinstantaneous regretrt(I,a)is the difference between
P(I)’s counterfactual value from playingavs. playingσ
on iterationt
rt(I,a) =vσ
t
(I,a)−vσ
t
(I) (2)
Thecounterfactual regretfor infosetIactionaon iteration
Tis
RT(I,a) =
∑T
t=
rt(I,a) (3)
Additionally,RT+(I,a) = max{RT(I,a), 0 }andRT(I) =
maxa{RT(I,a)}.Total regretforpin the entire game is
RTp= maxσ′p
∑T
t=
(
up(σp′,σt−p)−up(σtp,σt−p)
)
.
CFR determines an iteration’s strategy by applying any of
severalregret minimizationalgorithms to each infoset (Lit-
tlestone & Warmuth, 1994; Chaudhuri et al., 2009). Typi-
cally,regret matching(RM) is used as the regret minimiza-
tion algorithm within CFR due to RM’s simplicity and lack
of parameters (Hart & Mas-Colell, 2000).
In RM, a player picks a distribution over actions in an in-
foset in proportion to the positive regret on those actions.
Formally, on each iterationt+ 1,pselects actionsa∈A(I)
(^3) Some prior papers instead measureaverageexploitability
rather thantotal(summed) exploitability.

according to probabilities

σt+1(I,a) =
Rt+(I,a)
∑
a′∈A(I)R
t
+(I,a′)
(4)
If

∑
a′∈A(I)R
t
+(I,a
′) = 0then any arbitrary strategy may
be chosen. Typically each action is assigned equal proba-
bility, but in this paper we choose the action with highest
counterfactual regret with probability 1 , which we find em-
pirically helps RM better cope with approximation error
(see Figure 4).

If a player plays according to regret matching in in-
fosetIon every iteration, then on iterationT,RT(I)≤
∆

√
|A(I)|
√
T(Cesa-Bianchi & Lugosi, 2006). Zinkevich
et al. (2007) show that the sum of the counterfactual regret
across all infosets upper bounds the total regret. Therefore,
if playerpplays according to CFR on every iteration, then

RTp≤

∑
I∈IpR
T(I). So, asT→∞,R
Tp
T →^0.
The average strategyσ ̄pT(I)for an infosetIon iterationT

is ̄σpT(I) =

∑T
t=
(
πσpt(I)σpt(I)
)
∑T
t=1πσ
pt(I).
In two-player zero-sum games, if both players’ average

total regret satisfies
RTp
T ≤, then their average strategies
〈σ ̄T 1 ,σ ̄T 2 〉form a 2 -Nash equilibrium (Waugh, 2009). Thus,
CFR constitutes an anytime algorithm for finding an-Nash
equilibrium in two-player zero-sum games.

In practice, faster convergence is achieved by alternating
which player updates their regrets on each iteration rather
than updating the regrets of both players simultaneously
each iteration, though this complicates the theory (Farina
et al., 2018; Burch et al., 2018). We use the alternating-
updates form of CFR in this paper.

2.2. Monte Carlo Counterfactual Regret Minimization

Vanilla CFR requires full traversals of the game tree, which
is infeasible in large games. One method to combat this is
Monte Carlo CFR (MCCFR), in which only a portion of
the game tree is traversed on each iteration (Lanctot et al.,
2009). In MCCFR, a subset of nodesQtin the game tree is
traversed at each iteration, whereQtis sampled from some
distributionQ. Sampled regretsr ̃tare tracked rather than
exact regrets. For infosets that are sampled at iterationt,
r ̃t(I,a)is equal tort(I,a)divided by the probability of
having sampledI; for unsampled infosets ̃rt(I,a) = 0. See
Appendix B for more details.

There exist a number of MCCFR variants (Gibson et al.,
2012; Johanson et al., 2012; Jackson, 2017), but for this
paper we focus specifically on theexternal samplingvariant
due to its simplicity and strong performance. In external-
sampling MCCFR the game tree is traversed for one player
at a time, alternating back and forth. We refer to the player

who is traversing the game tree on the iteration as thetra-
verser. Regrets are updated only for the traverser on an
iteration. At infosets where the traverser acts, all actions are
explored. At other infosets and chance nodes, only a single
action is explored.
External-sampling MCCFR probabilistically converges to
an equilibrium. For anyρ∈(0,1], total regret is bounded
byRpT≤
(
1 +
√
√^2
ρ
)
|Ip|∆
√
|A|
√
Twith probability 1 −ρ.
3. Related Work
CFR is not the only iterative algorithm capable of solving
large imperfect-information games. First-order methods
converge to a Nash equilibrium inO(1/T)(Hoda et al.,
2010; Kroer et al., 2018b;a), which is far better than CFR’s
theoretical bound. However, in practice the fastest variants
of CFR are substantially faster than the best first-order meth-
ods. Moreover, CFR is more robust to error and therefore
likely to do better when combined with function approxima-
tion.
Neural Fictitious Self Play (NFSP) (Heinrich & Silver,
2016) previously combined deep learning function approx-
imation with Fictitious Play (Brown, 1951) to produce an
AI for heads-up limit Texas hold’em, a large imperfect-
information game. However, Fictitious Play has weaker
theoretical convergence guarantees than CFR, and in prac-
tice converges slower. We compare our algorithm to NFSP
in this paper. Model-free policy gradient algorithms have
been shown to minimize regret when parameters are tuned
appropriately (Srinivasan et al., 2018) and achieve perfor-
mance comparable to NFSP.
Past work has investigated using deep learning to esti-
mate values at the depth limit of a subgame in imperfect-
information games (Moravˇc ́ık et al., 2017; Brown et al.,
2018). However, tabular CFR was used within the sub-
games themselves. Large-scale function approximated CFR
has also been developed for single-agent settings (Jin et al.,
2017). Our algorithm is intended for the multi-agent set-
ting and is very different from the one proposed for the
single-agent setting.
Prior work has combined regression tree function approxi-
mation with CFR (Waugh et al., 2015) in an algorithm called
Regression CFR (RCFR). This algorithm defines a number
of features of the infosets in a game and calculates weights
to approximate the regrets that a tabular CFR implemen-
tation would produce. Regression CFR is algorithmically
similar to Deep CFR, but uses hand-crafted features similar
to those used in abstraction, rather than learning the features.
RCFR also uses full traversals of the game tree (which is
infeasible in large games) and has only been evaluated on
toy games. It is therefore best viewed as the first proof of
concept that function approximation can be applied to CFR.
Concurrent work has also investigated a similar combina-
tion of deep learning with CFR, in an algorithm referred
to as Double Neural CFR (Li et al., 2018). However, that
approach may not be theoretically sound and the authors
consider only small games. There are important differences
between our approaches in how training data is collected
and how the behavior of CFR is approximated.

4. Description of the Deep Counterfactual
Regret Minimization Algorithm
In this section we describe Deep CFR. The goal of Deep
CFR is to approximate the behavior of CFR without calcu-
lating and accumulating regrets at each infoset, by general-
izing across similar infosets using function approximation
via deep neural networks.

On each iterationt, Deep CFR conducts a constant num-
berKof partial traversals of the game tree, with the path
of the traversal determined according to external sampling
MCCFR. At each infosetIit encounters, it plays a strategy
σt(I)determined by regret matching on the output of a neu-
ral networkV:I→R|A|defined by parametersθtp−^1 that
takes as input the infosetIand outputs valuesV(I,a|θt−^1 ).
Our goal is forV(I,a|θt−^1 )to be approximately propor-
tional to the regretRt−^1 (I,a)that tabular CFR would have
produced.

When a terminal node is reached, the value is passed back up.
In chance and opponent infosets, the value of the sampled
action is passed back up unaltered. In traverser infosets, the
value passed back up is the weighted average of all action
values, where actiona’s weight isσt(I,a). This produces
samples of this iteration’s instantaneous regrets for various
actions. Samples are added to a memoryMv,p, wherep
is the traverser, using reservoir sampling (Vitter, 1985) if
capacity is exceeded.

Consider a nice property of the sampled instantaneous re-
grets induced by external sampling:

Lemma 1. For external sampling MCCFR, the sampled
instantaneous regrets are an unbiased estimator of thead-
vantage, i.e. the difference in expected payoff for playing
avsσtp(I)atI, assuming both players playσteverywhere
else.

EQ∈Qt
[
̃rσ
t
p(I,a)
∣
∣
∣ZI∩Q^6 =∅
]
=
vσ
t
(I,a)−vσ
t
(I)
πσ
t
−p(I)
.
The proof is provided in Appendix B.2.

Recent work in deep reinforcement learning has shown
that neural networks can effectively predict and generalize
advantages in challenging environments with large state
spaces, and use that to learn good policies (Mnih et al.,
2016).

Once a player’sKtraversals are completed, a new network
is trainedfrom scratchto determine parametersθtpby mini-
mizing MSE between predicted advantageVp(I,a|θt)and
samples of instantaneous regrets from prior iterationst′≤t
r ̃t
′
(I,a)drawn from the memory. The average over all
sampled instantaneous advantages ̃rt
′
(I,a)is proportional
to the total sampled regretR ̃t(I,a)(across actions in an
infoset), so once a sample is added to the memory it is never
removed except through reservoir sampling, even when the
next CFR iteration begins.
One can use any loss function for the value and average
strategy model that satisfies Bregman divergence (Banerjee
et al., 2005), such as mean squared error loss.
While almost any sampling scheme is acceptable so long
as the samples are weighed properly, external sampling
has the convenient property that it achieves both of our
desired goals by assigning all samples in an iteration equal
weight. Additionally, exploring all of a traverser’s actions
helps reduce variance. However, external sampling may
be impractical in games with extremely large branching
factors, so a different sampling scheme, such as outcome
sampling (Lanctot et al., 2009), may be desired in those
cases.
In addition to the value network, a separate policy network
Π :I→R|A|approximates the average strategy at the end
of the run, because it is theaverage strategy played over all
iterationsthat converges to a Nash equilibrium. To do this,
we maintain a separate memoryMΠof sampled infoset
probability vectors for both players. Whenever an infoset
Ibelonging to playerpis traversed during the opposing
player’s traversal of the game tree via external sampling,
the infoset probability vectorσt(I)is added toMΠand
assigned weightt.
If the number of Deep CFR iterations and the size of each
value network model is small, then one can avoid training
the final policy network by instead storing each iteration’s
value network (Steinberger, 2019). During actual play, a
value network is sampled randomly and the player plays the
CFR strategy resulting from the predicted advantages of that
network. This eliminates the function approximation error
of the final average policy network, but requires storing all
prior value networks. Nevertheless, strong performance and
low exploitability may still be achieved by storing only a
subset of the prior value networks (Jackson, 2016).
Theorem 1 states that if the memory buffer is sufficiently
large, then with high probability Deep CFR will result in
average regret being bounded by a constant proportional to
the square root of the function approximation error.
Theorem 1.LetTdenote the number of Deep CFR itera-
tions,|A|the maximum number of actions at any infoset,
andKthe number of traversals per iteration. LetLtVbe
the average MSE loss forVp(I,a|θt)on a sample inMV,p
at iterationt, and letLtV∗be the minimum loss achievable
for any functionV. LetLtV−LtV∗≤L.

If the value memories are sufficiently large, then with proba-
bility 1 −ρtotal regret at timeTis bounded by

RTp≤
(
1 +
√
2
√
ρK
)
∆|Ip|
√
|A|
√
T+ 4T|Ip|
√
|A|∆L
(5)
with probability 1 −ρ.

Corollary 1.AsT→∞, average regret
RTp
T is bounded by

4 |Ip|
√
|A|∆L
with high probability.

The proofs are provided in Appendix B.4.

We do not provide a convergence bound for Deep CFR when
using linear weighting, since the convergence rate of Linear
CFR has not been shown in the Monte Carlo case. However,
Figure 4 shows moderately faster convergence in practice.

5. Experimental Setup
We measure the performance of Deep CFR (Algorithm 1 )
in approximating an equilibrium in heads-up flop hold’em
poker (FHP). FHP is a large game with over 1012 nodes
and over 109 infosets. In contrast, the network we use has
98,948 parameters. FHP is similar to heads-up limit Texas
hold’em (HULH) poker, but ends after the second betting
round rather than the fourth, with only three community
cards ever dealt. We also measure performance relative to
domain-specific abstraction techniques in the benchmark
domain of HULH poker, which has over 1017 nodes and
over 1014 infosets. The rules for FHP and HULH are given
in Appendix A.

In both games, we compare performance to NFSP, which
is the previous leading algorithm for imperfect-information
game solving using domain-independent function approx-
imation, as well as state-of-the-art abstraction techniques
designed for the domain of poker (Johanson et al., 2013;
Ganzfried & Sandholm, 2014; Brown et al., 2015).

5.1. Network Architecture

We use the neural network architecture shown in Figure 5.
for both the value networkVthat computes advantages for
each player and the networkΠthat approximates the final
average strategy. This network has a depth of 7 layers and
98,948 parameters. Infosets consist of sets of cards and
bet history. The cards are represented as the sum of three
embeddings: a rank embedding (1-13), a suit embedding

Figure 1.The neural network architecture used for Deep CFR.
The network takes an infoset (observed cards and bet history) as
input and outputs values (advantages or probability logits) for each
possible action.
(1-4), and a card embedding (1-52). These embeddings
are summed for each set of permutation invariant cards
(hole, flop, turn, river), and these are concatenated. In
each of theNroundsrounds of betting there can be at most 6
sequential actions, leading to 6 Nroundstotal unique betting
positions. Each betting position is encoded by a binary
value specifying whether a bet has occurred, and a float
value specifying the bet size.
The neural network model begins with separate branches for
the cards and bets, with three and two layers respectively.
Features from the two branches are combined and three
additional fully connected layers are applied. Each fully-
connected layer consists ofxi+1=ReLU(Ax[+x]). The
optional skip connection[+x]is applied only on layers that
have equal input and output dimension. Normalization (to
zero mean and unit variance) is applied to the last-layer
features. The network architecture was not highly tuned, but
normalization and skip connections were used because they
were found to be important to encourage fast convergence
when running preliminary experiments on pre-computed
equilibrium strategies in FHP. A full network specification
is provided in Appendix C.
In the value network, the vector of outputs represented pre-
dicted advantages for each action at the input infoset. In the
average strategy network, outputs are interpreted as logits
of the probability distribution over actions.
5.2. Model training
We allocate a maximum size of 40 million infosets to each
player’s advantage memoryMV,pand the strategy memory
MΠ. The value model is trained from scratch each CFR
iteration, starting from a random initialization. We perform
4,000 mini-batch stochastic gradient descent (SGD) itera-
tions using a batch size of 10,000 and perform parameter
updates using the Adam optimizer (Kingma & Ba, 2014)
with a learning rate of 0. 001 , with gradient norm clipping
to 1. For HULH we use 32,000 SGD iterations and a batch
size of 20,000. Figure 4 shows that training the model from
Algorithm 1Deep Counterfactual Regret Minimization
functionDEEPCFR
Initialize each player’s advantage networkV(I,a|θp)with parametersθpso that it returns 0 for all inputs.
Initialize reservoir-sampled advantage memoriesMV, 1 ,MV, 2 and strategy memoryMΠ.
forCFR iterationt= 1toTdo
for eachplayerpdo
fortraversalk= 1toKdo
TRAVERSE(∅,p,θ 1 ,θ 2 ,MV,p,MΠ) .Collect data from a game traversal with external sampling
Trainθpfrom scratch on lossL(θp) =E(I,t′,r ̃t′)∼MV,p

[
t′
∑
a
(
r ̃t
′
(a)−V(I,a|θp)
) 2 ]
TrainθΠon lossL(θΠ) =E(I,t′,σt′)∼MΠ
[
t′
∑
a
(
σt
′
(a)−Π(I,a|θΠ)
) 2 ]
returnθΠ
Algorithm 2CFR Traversal with External Sampling
functionTRAVERSE(h,p,θ 1 ,θ 2 ,MV,MΠ, t)
Input:Historyh, traverser playerp, regret network parametersθfor each player, advantage memoryMVfor player
p, strategy memoryMΠ, CFR iterationt.

ifhis terminalthen
returnthe payoff to playerp
else ifhis a chance nodethen
a∼σ(h)
returnTRAVERSE(h·a,p,θ 1 ,θ 2 ,MV,MΠ, t)
else ifP(h) =pthen .If it’s the traverser’s turn to act
Compute strategyσt(I)from predicted advantagesV(I(h),a|θp)using regret matching.
fora∈A(h)do
v(a)←TRAVERSE(h·a,p,θ 1 ,θ 2 ,MV,MΠ, t) .Traverse each action
fora∈A(h)do
r ̃(I,a)←v(a)−
∑
a′∈A(h)σ(I,a
′)·v(a′) .Compute advantages
Insert the infoset and its action advantages(I,t,r ̃t(I))into the advantage memoryMV
else .If it’s the opponent’s turn to act
Compute strategyσt(I)from predicted advantagesV(I(h),a|θ 3 −p)using regret matching.
Insert the infoset and its action probabilities(I,t,σt(I))into the strategy memoryMΠ
Sample an actionafrom the probability distributionσt(I).
returnTRAVERSE(h·a,p,θ 1 ,θ 2 ,MV,MΠ, t)
scratch at each iteration, rather than using the weights from
the previous iteration, leads to better convergence.

5.3. Linear CFR

There exist a number of variants of CFR that achieve much
faster performance than vanilla CFR. However, most of
these faster variants of CFR do not handle approximation
error well (Tammelin et al., 2015; Burch, 2017; Brown &
Sandholm, 2019; Schmid et al., 2019). In this paper we use
Linear CFR (LCFR)(Brown & Sandholm, 2019), a variant
of CFR that is faster than CFR and in certain settings is
the fastest-known variant of CFR (particularly in settings
with wide distributions in payoffs), and which tolerates
approximation error well. LCFR is not essential and does

not appear to lead to better performance asymptotically, but
does result in faster convergence in our experiments.
LCFR is like CFR except iterationtis weighed byt. Specif-
ically, we maintain aweighton each entry stored in the
advantage memory and the strategy memory, equal tot
when this entry was added. When trainingθpeach itera-
tionT, we rescale all the batch weights byT^2 and minimize
weighted error.
6. Experimental Results
Figure 2 compares the performance of Deep CFR to
different-sized domain-specific abstractions in FHP. The ab-
stractions are solved using external-sampling Linear Monte
Carlo CFR (Lanctot et al., 2009; Brown & Sandholm, 2019),
which is the leading algorithm in this setting. The 40,
cluster abstraction means that the more than 109 different
decisions in the game were clustered into 40,000 abstract
decisions, where situations in the same bucket are treated
identically. This bucketing is done using K-means clustering
on domain-specific features. Thelossless abstractiononly
clusters together situations that are strategically isomorphic
(e.g., flushes that differ only by suit), so a solution to this
abstraction maps to a solution in the full game without error.

Performance and exploitability are measured in terms of
milli big blinds per game (mbb/g), which is a standard
measure of win rate in poker.

The figure shows that Deep CFR asymptotically reaches a
similar level of exploitability as the abstraction that uses 3.
million clusters, but converges substantially faster. Although
Deep CFR is more efficient in terms of nodes touched, neu-
ral network inference and training requires considerable
overhead that tabular CFR avoids. However, Deep CFR
does not require advanced domain knowledge. We show
Deep CFR performance for 10,000 CFR traversals per step.
Using more traversals per step is less sample efficient and
requires greater neural network training time but requires
fewer CFR steps.

Figure 2 also compares the performance of Deep CFR to
NFSP, an existing method for learning approximate Nash
equilibria in imperfect-information games. NFSP approx-
imates fictitious self-play, which is proven to converge to
a Nash equilibrium but in practice does so far slower than
CFR. We observe that Deep CFR reaches an exploitability
of 37 mbb/g while NFSP converges to 47 mbb/g.^4 We also
observe that Deep CFR is more sample efficient than NFSP.
However, these methods spend most of their wallclock time
performing SGD steps, so in our implementation we see a
less dramatic improvement over NFSP in wallclock time
than sample efficiency.

Figure 3 shows the performance of Deep CFR using differ-
ent numbers of game traversals, network SGD steps, and
model size. As the number of CFR traversals per iteration
is reduced, convergence becomes slower but the model con-
verges to the same final exploitability. This is presumably
because it takes more iterations to collect enough data to
reduce the variance sufficiently. On the other hand, reduc-
ing the number of SGD steps does not change the rate of
convergence but affects the asymptotic exploitability of the

(^4) We run NFSP with the same model architecture as we use
for Deep CFR. In the benchmark game of Leduc Hold’em, our
implementation of NFSP achieves an average exploitability (total
exploitability divided by two) of 37 mbb/g in the benchmark game
of Leduc Hold’em, which is substantially lower than originally
reported in Heinrich & Silver (2016). We report NFSP’s best
performance in FHP across a sweep of hyperparameters.
model. This is presumably because the model loss decreases
as the number of training steps is increased per iteration (see
Theorem 1). Increasing the model size also decreases final
exploitability up to a certain model size in FHP.
In Figure 4 we consider ablations of certain components of
Deep CFR. Retraining the regret model from scratch at each
CFR iteration converges to a substantially lower exploitabil-
ity than fine-tuning a single model across all iterations. We
suspect that this is because a single model gets stuck in bad
local minima as the objective is changed from iteration to
iteration. The choice of reservoir sampling to update the
memories is shown to be crucial; if a sliding window mem-
ory is used, the exploitability begins to increase once the
memory is filled up, even if the memory is large enough to
hold the samples from many CFR iterations.
Finally, we measure head-to-head performance in HULH.
We compare Deep CFR and NFSP to the approximate solu-
tions (solved via Linear Monte Carlo CFR) of three different-
sized abstractions: one in which the more than 1014 deci-
sions are clustered into 3. 3 · 106 buckets, one in which there
are 3. 3 · 107 buckets and one in which there are 3. 3 · 108 buck-
ets. The results are presented in Table 1. For comparison,
the largest abstractions used by the poker AI Polaris in its
2007 HULH man-machine competition against human pro-
fessionals contained roughly 3 · 108 buckets. When variance-
reduction techniques were applied, the results showed that
the professional human competitors lost to the 2007 Polaris
AI by about 52 ± 10 mbb/g (Johanson, 2016). In contrast,
our Deep CFR agent loses to a 3. 3 · 108 bucket abstraction
by only− 11 ± 2 mbb/g and beats NFSP by 43 ± 2 mbb/g.
(^106107108) Nodes Touched 109 1010 1011
102
103
Exploitability (mbb/g)
Convergence of Deep CFR, NFSP, and Domain-Specific Abstractions
Deep CFR
NFSP (1,000 infosets / update)NFSP (10,000 infosets / update)
Abstraction (40,000 Clusters)Abstraction (368,000 Clusters)
Abstraction (3,644,000 Clusters)Lossless Abstraction (234M Clusters)
Figure 2.Comparison of Deep CFR with domain-specific tabular
abstractions and NFSP in FHP. Coarser abstractions converge faster
but are more exploitable. Deep CFR converges with 2-3 orders of
magnitude fewer samples than a lossless abstraction, and performs
competitively with a 3.6 million cluster abstraction. Deep CFR
achieves lower exploitability than NFSP, while traversing fewer
infosets.

Opponent Model
Abstraction Size
Model NFSP Deep CFR 3. 3 · 106 3. 3 · 107 3. 3 · 108
NFSP - − 43 ± 2 mbb/g − 40 ± 2 mbb/g − 49 ± 2 mbb/g − 55 ± 2 mbb/g
Deep CFR +43± 2 mbb/g - +6± 2 mbb/g − 6 ± 2 mbb/g − 11 ± 2 mbb/g
Table 1.Head-to-head expected value of NFSP and Deep CFR in HULH against converged CFR equilibria with varying abstraction sizes.
For comparison, in 2007 an AI using abstractions of roughly 3 · 108 buckets defeated human professionals by about 52 mbb/g (after
variance reduction techniques were applied).
(^101) CFR Iteration 102
102
103
Exploitability (mbb/g)
Traversals per iter3,
10,00030,
100,000300,
1,000,000Linear CFR
(^101) CFR Iteration 102
102
103
Exploitability (mbb/g)
SGD steps per iter
1,0002,
4,
8,00016,
32,000Linear CFR
(^104) # Model Parameters 105 106
102
Exploitability (mbb/g)
dim=
dim=
dim=
dim=
dim=128dim=
Figure 3.Left:FHP convergence for different numbers of training data collection traversals per simulated LCFR iteration. The dotted
line shows the performance of vanilla tabular Linear CFR without abstraction or sampling.Middle:FHP convergence using different
numbers of minibatch SGD updates to train the advantage model at each LCFR iteration.Right:Exploitability of Deep CFR in FHP for
different model sizes. Label indicates the dimension (number of features) in each hidden layer of the model.
101 102
CFR Iteration
102
103
Exploitability (mbb/g)
Deep CFR (5 replicates)Deep CFR without Linear Weighting
Deep CFR without Retraining from ScratchDeep CFR Playing Uniform when All Regrets < 0
101 102
CFR Iteration
102
103
Exploitability (mbb/g)
Deep CFR
Deep CFR with Sliding Window Memories
Figure 4.Ablations of Deep CFR components in FHP.Left:As a baseline, we plot 5 replicates of Deep CFR, which show consistent
exploitability curves (standard deviation att= 450is 2. 25 mbb/g). Deep CFR without linear weighting converges to a similar
exploitability, but more slowly. If the same network is fine-tuned at each CFR iteration rather than training from scratch, the final
exploitability is about 50% higher. Also, if the algorithm plays a uniform strategy when all regrets are negative (i.e. standard regret
matching), rather than the highest-regret action, the final exploitability is also 50% higher.Right:If Deep CFR is performed using
sliding-window memories, exploitability stops converging once the buffer becomes full^6. However, with reservoir sampling, convergence
continues after the memories are full.

7. Conclusions
We describe a method to find approximate equilibria in
large imperfect-information games by combining the CFR
algorithm with deep neural network function approxima-
tion. This method is theoretically principled and achieves
strong performance in large poker games relative to domain-
specific abstraction techniques without relying on advanced
domain knowledge. This is the first non-tabular variant of
CFR to be successful in large games.
Deep CFR and other neural methods for imperfect-
information games provide a promising direction for tack-
ling large games whose state or action spaces are too large
for tabular methods and where abstraction is not straight-
forward. Extending Deep CFR to larger games will likely
require more scalable sampling strategies than those used in
this work, as well as strategies to reduce the high variance
in sampled payoffs. Recent work has suggested promising
directions both for more scalable sampling (Li et al., 2018)
and variance reduction techniques (Schmid et al., 2019). We
believe these are important areas for future work.
8. Acknowledgments
This material is based on work supported by the National
Science Foundation under grants IIS-1718457, IIS-1617590,
IIS-1901403, and CCF-1733556, and the ARO under award
W911NF-17-1-0082. Noam Brown was partly supported by
an Open Philanthropy Project AI Fellowship and a Tencent
AI Lab fellowship.

References
Banerjee, A., Merugu, S., Dhillon, I. S., and Ghosh, J. Clus-
tering with bregman divergences. Journal of machine
learning research, 6(Oct):1705–1749, 2005.

Bowling, M., Burch, N., Johanson, M., and Tammelin, O.
Heads-up limit hold’em poker is solved. Science, 347
(6218):145–149, January 2015.

Brown, G. W. Iterative solutions of games by fictitious play.
In Koopmans, T. C. (ed.),Activity Analysis of Production
and Allocation, pp. 374–376. John Wiley & Sons, 1951.

Brown, N. and Sandholm, T. Superhuman AI for heads-up
no-limit poker: Libratus beats top professionals.Science,
pp. eaao1733, 2017.

Brown, N. and Sandholm, T. Solving imperfect-information
games via discounted regret minimization. InAAAI Con-
ference on Artificial Intelligence (AAAI), 2019.

Brown, N., Ganzfried, S., and Sandholm, T. Hierarchical ab-
straction, distributed equilibrium computation, and post-
processing, with application to a champion no-limit texas
hold’em agent. InProceedings of the 2015 International
Conference on Autonomous Agents and Multiagent Sys-
tems, pp. 7–15. International Foundation for Autonomous
Agents and Multiagent Systems, 2015.

Brown, N., Sandholm, T., and Amos, B. Depth-limited
solving for imperfect-information games. InAdvances in
Neural Information Processing Systems, 2018.

Burch, N. Time and Space: Why Imperfect Information
Games are Hard. PhD thesis, University of Alberta, 2017.

Burch, N., Moravcik, M., and Schmid, M. Revisiting cfr+
and alternating updates.arXiv preprint arXiv:1810.11542,

Cesa-Bianchi, N. and Lugosi, G.Prediction, learning, and
games. Cambridge University Press, 2006.

Chaudhuri, K., Freund, Y., and Hsu, D. J. A parameter-free
hedging algorithm. InAdvances in neural information
processing systems, pp. 297–305, 2009.

Farina, G., Kroer, C., and Sandholm, T. Online convex opti-
mization for sequential decision processes and extensive-
form games. InAAAI Conference on Artificial Intelli-
gence (AAAI), 2018.
Farina, G., Kroer, C., Brown, N., and Sandholm, T. Stable-
predictive optimistic counterfactual regret minimization.
InInternational Conference on Machine Learning, 2019.
Ganzfried, S. and Sandholm, T. Potential-aware imperfect-
recall abstraction with earth mover’s distance in
imperfect-information games. InAAAI Conference on
Artificial Intelligence (AAAI), 2014.
Gibson, R., Lanctot, M., Burch, N., Szafron, D., and Bowl-
ing, M. Generalized sampling and variance in coun-
terfactual regret minimization. InProceedins of the
Twenty-Sixth AAAI Conference on Artificial Intelligence,
pp. 1355–1361, 2012.
Hart, S. and Mas-Colell, A. A simple adaptive procedure
leading to correlated equilibrium. Econometrica, 68:
1127–1150, 2000.
Heinrich, J. and Silver, D. Deep reinforcement learning
from self-play in imperfect-information games. arXiv
preprint arXiv:1603.01121, 2016.
Hoda, S., Gilpin, A., Pe ̃na, J., and Sandholm, T. Smoothing
techniques for computing Nash equilibria of sequential
games.Mathematics of Operations Research, 35(2):494–
512, 2010. Conference version appeared in WINE-07.
Jackson, E. Targeted CFR. InAAAI Workshop on Computer
Poker and Imperfect Information, 2017.
Jackson, E. G. Compact CFR. InAAAI Workshop on Com-
puter Poker and Imperfect Information, 2016.
Jin, P. H., Levine, S., and Keutzer, K. Regret minimiza-
tion for partially observable deep reinforcement learning.
arXiv preprint arXiv:1710.11424, 2017.
Johanson, M., Bard, N., Lanctot, M., Gibson, R., and
Bowling, M. Efficient nash equilibrium approximation
through monte carlo counterfactual regret minimization.
InProceedings of the 11th International Conference on
Autonomous Agents and Multiagent Systems-Volume 2,
pp. 837–846. International Foundation for Autonomous
Agents and Multiagent Systems, 2012.
Johanson, M., Burch, N., Valenzano, R., and Bowling,
M. Evaluating state-space abstractions in extensive-form
games. InProceedings of the 2013 International Con-
ference on Autonomous Agents and Multiagent Systems,
pp. 271–278. International Foundation for Autonomous
Agents and Multiagent Systems, 2013.
Johanson, M. B.Robust Strategies and Counter-Strategies:
From Superhuman to Optimal Play. PhD thesis, Univer-
sity of Alberta, 2016.

Kingma, D. P. and Ba, J. Adam: A method for stochastic
optimization.arXiv preprint arXiv:1412.6980, 2014.

Kroer, C., Farina, G., and Sandholm, T. Solving large
sequential games with the excessive gap technique. In
Advances in Neural Information Processing Systems, pp.
864–874, 2018a.

Kroer, C., Waugh, K., Kılınc ̧-Karzan, F., and Sandholm, T.
Faster algorithms for extensive-form game solving via
improved smoothing functions.Mathematical Program-
ming, pp. 1–33, 2018b.

Lample, G. and Chaplot, D. S. Playing FPS games with
deep reinforcement learning. InAAAI, pp. 2140–2146,

Lanctot, M. Monte carlo sampling and regret minimization
for equilibrium computation and decision-making in large
extensive form games. 2013.

Lanctot, M., Waugh, K., Zinkevich, M., and Bowling, M.
Monte Carlo sampling for regret minimization in exten-
sive games. InProceedings of the Annual Conference
on Neural Information Processing Systems (NIPS), pp.
1078–1086, 2009.

Li, H., Hu, K., Ge, Z., Jiang, T., Qi, Y., and Song, L. Double
neural counterfactual regret minimization.arXiv preprint
arXiv:1812.10607, 2018.

Littlestone, N. and Warmuth, M. K. The weighted majority
algorithm.Information and Computation, 108(2):212–
261, 1994.

Mnih, V., Kavukcuoglu, K., Silver, D., Rusu, A. A., Veness,
J., Bellemare, M. G., Graves, A., Riedmiller, M., Fidje-
land, A. K., Ostrovski, G., et al. Human-level control
through deep reinforcement learning.Nature, 518(7540):
529, 2015.

Mnih, V., Badia, A. P., Mirza, M., Graves, A., Lillicrap,
T., Harley, T., Silver, D., and Kavukcuoglu, K. Asyn-
chronous methods for deep reinforcement learning. In
International conference on machine learning, pp. 1928–
1937, 2016.

Moravˇc ́ık, M., Schmid, M., Burch, N., Lisy, V., Morrill, D., ́
Bard, N., Davis, T., Waugh, K., Johanson, M., and Bowl-
ing, M. Deepstack: Expert-level artificial intelligence in
heads-up no-limit poker.Science, 2017. ISSN 0036-8075.
doi: 10.1126/science.aam6960.

Morrill, D. R. Using regret estimation to solve games com-
pactly. Master’s thesis, University of Alberta, 2016.

Nash, J. Equilibrium points in n-person games.Proceedings
of the National Academy of Sciences, 36:48–49, 1950.
Paszke, A., Gross, S., Chintala, S., Chanan, G., Yang, E.,
DeVito, Z., Lin, Z., Desmaison, A., Antiga, L., and Lerer,
A. Automatic differentiation in pytorch. 2017.
Schmid, M., Burch, N., Lanctot, M., Moravcik, M., Kadlec,
R., and Bowling, M. Variance reduction in monte carlo
counterfactual regret minimization (VR-MCCFR) for ex-
tensive form games using baselines. InAAAI Conference
on Artificial Intelligence (AAAI), 2019.
Silver, D., Schrittwieser, J., Simonyan, K., Antonoglou,
I., Huang, A., Guez, A., Hubert, T., Baker, L., Lai, M.,
Bolton, A., et al. Mastering the game of go without
human knowledge.Nature, 550(7676):354, 2017.
Silver, D., Hubert, T., Schrittwieser, J., Antonoglou, I., Lai,
M., Guez, A., Lanctot, M., Sifre, L., Kumaran, D., Grae-
pel, T., et al. A general reinforcement learning algorithm
that masters chess, shogi, and go through self-play.Sci-
ence, 362(6419):1140–1144, 2018.
Srinivasan, S., Lanctot, M., Zambaldi, V., Perolat, J., Tuyls, ́
K., Munos, R., and Bowling, M. Actor-critic policy opti-
mization in partially observable multiagent environments.
InAdvances in Neural Information Processing Systems,
pp. 3426–3439, 2018.
Steinberger, E. Single deep counterfactual regret minimiza-
tion.arXiv preprint arXiv:1901.07621, 2019.
Tammelin, O., Burch, N., Johanson, M., and Bowling, M.
Solving heads-up limit texas hold’em. InProceedings
of the International Joint Conference on Artificial Intelli-
gence (IJCAI), pp. 645–652, 2015.
Vitter, J. S. Random sampling with a reservoir. ACM
Transactions on Mathematical Software (TOMS), 11(1):
37–57, 1985.
Waugh, K. Abstraction in large extensive games. Master’s
thesis, University of Alberta, 2009.
Waugh, K., Morrill, D., Bagnell, D., and Bowling, M. Solv-
ing games with functional regret estimation. InAAAI
Conference on Artificial Intelligence (AAAI), 2015.
Zinkevich, M., Johanson, M., Bowling, M. H., and Pic-
cione, C. Regret minimization in games with incomplete
information. InProceedings of the Annual Conference
on Neural Information Processing Systems (NIPS), pp.
1729–1736, 2007.