
1

Automatic Zoom
Solving Imperfect-Information Games
via Discounted Regret Minimization
Noam Brown
Computer Science Department
Carnegie Mellon University
noamb@cs.cmu.edu
Tuomas Sandholm
Computer Science Department
Carnegie Mellon University
sandholm@cs.cmu.edu
Abstract
Counterfactual regret minimization (CFR) is a family of iter-
ative algorithms that are the most popular and, in practice,
fastest approach to approximately solving large imperfect-
information games. In this paper we introduce novel CFR
variants that 1) discount regrets from earlier iterations in var-
ious ways (in some cases differently for positive and nega-
tive regrets), 2) reweight iterations in various ways to ob-
tain the output strategies, 3) use a non-standard regret min-
imizer and/or 4) leverage “optimistic regret matching”. They
lead to dramatically improved performance in many settings.
For one, we introduce a variant that outperforms CFR+, the
prior state-of-the-art algorithm, in every game tested, includ-
ing large-scale realistic settings. CFR+ is a formidable bench-
mark: no other algorithm has been able to outperform it. Fi-
nally, we show that, unlike CFR+, many of the important new
variants are compatible with modern imperfect-information-
game pruning techniques and one is also compatible with
sampling in the game tree.
Introduction
Imperfect-information games model strategic interactions
between players that have hidden information, such as in
negotiations, cybersecurity, and auctions. A common bench-
mark for progress in this class of games is poker. The typi-
cal goal is to find an (approximate) equilibrium in which no
player can improve by deviating from the equilibrium.
For extremely large imperfect-information games that
cannot fit in a linear program of manageable size, typically
iterative algorithms are used to approximate an equilibrium.
A number of such iterative algorithms exist (Nesterov 2005;
Hoda et al. 2010; Pays 2014; Kroer et al. 2015; Heinrich,
Lanctot, and Silver 2015). The most popular ones are vari-
ants of counterfactual regret minimization (CFR) (Zinke-
vich et al. 2007; Lanctot et al. 2009; Gibson et al. 2012).
In particular, the development of CFR+ was a key break-
through that in many cases is at least an order of magni-
tude faster than vanilla CFR (Tammelin 2014; Tammelin
et al. 2015). CFR+ was used to essentially solve heads-
up limit Texas hold’em poker (Bowling et al. 2015) and
was used to approximately solve heads-up no-limit Texas
hold’em (HUNL) endgames in Libratus, which defeated
Copyright c© 2019, Association for the Advancement of Artificial
Intelligence (www.aaai.org). All rights reserved.
HUNL top professionals (Brown and Sandholm 2017c;
Brown and Sandholm 2017b). A blend of CFR and CFR+
was used by DeepStack to defeat poker professionals in
HUNL (Moravˇc ́ık et al. 2017).
The best known theoretical bound on the number of it-
erations needed for CFR and CFR+ to converge to an
-equilibrium (defined formally in the next section) is
O( 1
2 ) (Zinkevich et al. 2007; Tammelin et al. 2015). This is
asymptotically slower than first-order methods that converge
at rate O( 1
 ) (Hoda et al. 2010; Kroer et al. 2015). However,
in practice CFR+ converges much faster than its theoretical
bound, and even faster than O( 1
 ) in many games.
Nevertheless, we show in this paper that one can design
new variants of CFR that significantly outperform CFR+.
We show that CFR+ does relatively poorly in games where
some actions are very costly mistakes (that is, they cause
high regret in that iteration) and provide an intuitive example
and explanation for this. To address this weakness, we intro-
duce variants of CFR that do not assign uniform weight to
each iteration. Instead, earlier iterations are discounted. As
we show, this high-level idea can be instantiated in many dif-
ferent ways. Furthermore, some combinations of our ideas
perform significantly better than CFR+ while others perform
worse than it. In particular, one variant outperforms CFR+ in
every game tested.
Notation and Background
We focus on sequential games as the most interesting and
challenging application of this work, but our techniques also
apply to non-sequential games. In an imperfect-information
extensive-form (that is, tree-form) game there is a finite set
of players, P. “Nature” is also considered a player (rep-
resenting chance) and chooses actions with a fixed known
probability distribution. A state h is defined by all infor-
mation of the current situation, including private knowledge
known to only a subset of players. A(h) is the actions avail-
able in a node and P (h) is the unique player who acts at that
node. If action a ∈ A(h) leads from h to h′, then we write
h · a = h′. H is the set of all states in the game tree. Z ⊆ H
are terminal states for which no actions are available. For
each player i ∈ P, there is a payoff function ui : Z → R.
We denote the range of payoffs in the game by ∆. Formally,
∆i = maxz∈Z ui(z) − minz∈Z ui(z) and ∆ = maxi∈P ∆i.
Imperfect information is represented by information sets
(infosets) for each player i ∈ P. For any infoset I belong-
ing to player i, all states h, h′ ∈ I are indistinguishable to
player i. Every non-terminal state h ∈ H belongs to exactly
one infoset for each player i. The set of actions that may be
chosen in I is represented as A(I). We represent the set of
all infosets belonging to player i where i acts by Ii.
A strategy σi(I) is a probability vector over actions for
player i in infoset I. The probability of a particular action a
is denoted by σi(I, a). Since all states in an infoset belong-
ing to player i are indistinguishable, the strategies in each
of them are identical. Therefore, for any h ∈ I we define
σi(h, a) = σi(I, a) where i = P (h). We define σi to be
a strategy for player i in every infoset in the game where
player i acts. A strategy profile σ is a tuple of strategies, one
per player. The strategy of every player other than i is repre-
sented as σ−i. ui(σi, σ−i) is the expected payoff for player
i if all players play according to strategy profile 〈σi, σ−i〉.
πσ (h) = Πh′ ·avhσP (h′ )(h′, a) is the joint probability of
reaching h if all players play according to σ. πσ
i (h) is the
contribution of player i to this probability (that is, the prob-
ability of reaching h if all players other than i, and chance,
always chose actions leading to h). πσ
−i(h) is the contribu-
tion of chance and all players other than i.
A best response to σi is a strategy BR(σi) such that
ui
(σi, BR(σi)) = maxσ′
−i ui(σi, σ′
−i). A Nash equilib-
rium σ∗ is a strategy profile where everyone plays a best re-
sponse: ∀i, ui(σ∗
i , σ∗
−i) = maxσ′
i ui(σ′
i, σ∗
−i) (Nash 1950).
The exploitability e(σi) of a strategy σi in a two-player
zero-sum game is how much worse it does versus a best re-
sponse compared to a Nash equilibrium strategy. Formally,
e(σi) = ui
(σ∗
i , BR(σ∗
i )) − ui
(σi, BR(σi)). In an -Nash
equilibrium, no player has exploitability higher than .
In CFR, the strategy vector for each infoset is determined
according to a regret-minimization algorithm. Typically, re-
gret matching (RM) is used as that algorithm within CFR
due to RM’s simplicity and lack of parameters.
The expected value (or simply value) to player i at
state h given that all players play according to strategy
profile σ from that point on is defined as vσ
i (h). The
value to i at infoset I where i acts is the weighted av-
erage of the value of each state in the infoset, where
the weight is proportional to i’s belief that they are in
that state conditional on knowing they are in I. For-
mally, vσ (I) = ∑
h∈I
(πσ
−i(h|I)vσ
i (h)) and vσ (I, a) =
∑
h∈I
(πσ
−i(h|I)vσ
i (h · a)) where πσ
−i(h|I) = πσ
−i(h)
πσ
−i(I) .
Let σt be the strategy on iteration t. The instantaneous
regret for action a in infoset I on iteration t is rt(I, a) =
vσt
(I, a) − vσt
(I) and the regret on iteration T is
RT (I, a) =
T∑
t=1
rT (I, a) (1)
Additionally, RT
+(I, a) = max{RT (I, a), 0} and RT (I) =
maxa{RT
+(I, a)}. Regret for player i in the entire game is
RT
i = max
σ′
i
T∑
t=1
(ui(σ′
i, σt
−i) − ui(σt
i , σt
−i)) (2)
In RM, a player picks a distribution over actions in an
infoset in proportion to the positive regret on those actions.
Formally, on each iteration T + 1, player i selects actions
a ∈ A(I) according to probabilities
σT +1(I, a) =



RT
+ (I,a)
∑
a′ ∈A(I) RT
+ (I,a′ ) , if ∑
a′ RT
+(I, a′) > 0
1
|A(I)| , otherwise
(3)
If a player plays according to regret matching in in-
foset I on every iteration, then on iteration T , RT (I) ≤
∆√|A(I)|√T (Cesa-Bianchi and Lugosi 2006).
If a player plays according to CFR on every iteration, then
RT
i ≤ ∑
I∈Ii
RT (I) (4)
So, as T → ∞, RT
i
T → 0.
The average strategy  ̄σT
i (I) for an infoset I is
 ̄σT
i (I) =
∑T
t=1
(πσt
i (I)σt
i (I))
∑T
t=1 πσt
i (I) (5)
CFR minimizes external regret (Zinkevich et al. 2007), so
it converges to a coarse correlated equilibrium (Hart and
Mas-Colell 2000). In two-player zero-sum games, this is
also a Nash equilibrium. In two-player zero-sum games, if
both players’ average regret satisfies RT
i
T ≤ , then their av-
erage strategies 〈 ̄σT
1 ,  ̄σT
2 〉 are a 2-Nash equilibrium (Waugh
2009). Thus, CFR is an anytime algorithm for finding an -
Nash equilibrium in two-player zero-sum games.
Although CFR theory calls for both players to simultane-
ously update their regrets on each iteration, in practice far
better performance is achieved by alternating which player
updates their regrets on each iteration. However, this compli-
cates the theory for convergence (Farina, Kroer, and Sand-
holm ; Burch, Moravcik, and Schmid 2018).
CFR+ is like CFR but with the following small changes.
First, after each iteration any action with negative regret
is set to zero regret. Formally, CFR+ chooses its strategy
on iteration T + 1 according to Regret Matching+ (RM+),
which is identical to Equation (3) but uses the regret-like
value QT (I, a) = max{0, QT −1(I, a) + rt(I, a)} rather
than RT
+(I, a). Second, CFR+ uses a weighted average strat-
egy where iteration T is weighted by T rather than using
a uniformly-weighted average strategy as in CFR. The best
known convergence bound for CFR+ is higher (that is, worse
in exploitability) than CFR by a constant factor of 2. Despite
that, CFR+ typically converges much faster than CFR and
usually even faster than O( 1
 ).
However, in some games CFR+ converges slower than
1
T . We now provide a two-player zero-sum game with this
property. Consider the payoff matrix [ 1 0.9
−0.7 1
] (where P1
chooses a row and P2 simultaneously chooses a column; the
chosen entry in the matrix is the payoff for P1 while P2 re-
ceives the opposite). We now proceed to introducing our im-
provements to the CFR family.
Weighted Averaging Schemes for CFR+
As described in the previous section, CFR+ traditionally
uses “linear” averaging, in which iteration t’s contribution
to the average strategy is proportional to t. In this section we
prove a bound for any sequence of non-decreasing weights
when calculating the average strategy. However, the bound
on convergence is never lower than that of vanilla CFR (that
is, uniformly equal weight on the iterations).
Theorem 1. Suppose T iterations of RM+ are played
in a two-player zero-sum game. Then the weighted aver-
age strategy profile, where iteration t is weighed propor-
tional to wt > 0 and wi ≤ wj for all i < j, is a
wT∑T
t=1 wt
∆|I|√|A|√T -Nash equilibrium.
The proof is in the appendix. It largely follows the proof
for linear averaging in CFR+ (Tammelin et al. 2015).
Empirically we observed that CFR+ converges faster
when assigning iteration t a weight of t2 rather than a weight
of t when calculating the average strategy. We therefore use
this weight for CFR+ and its variants throughout this paper
when calculating the average strategy.
Regret Discounting for CFR and Its Variants
In all past variants of CFR, each iteration’s contribution
to the regrets is assigned equal weight. In this section we
discuss discounting iterations in CFR when determining
regrets—in particular, assigning less weight to earlier iter-
ations. This is very different from, and orthogonal to, the
idea of discounting iterations when computing the average
strategy, described in the previous section.
To motivate discounting, consider the simple case of an
agent deciding between three actions. The payoffs for the
actions are 0, 1, and -1,000,000, respectively. From (3) we
see that CFR and CFR+ assign equal probability to each ac-
tion on the first iteration. This results in regrets of 333,333,
333,334, and 0, respectively. If we continue to run CFR or
CFR+, the next iteration will choose the first and second ac-
tion with roughly 50% probability each, and the regrets will
be updated to be roughly 333,332.5 and 333,334.5, respec-
tively. It will take 471,407 iterations for the agent to choose
the second action—that is, the best action—with 100% prob-
ability. Discounting the first iteration over time would dra-
matically speed convergence in this case. While this might
seem like a contrived example, many games include highly
suboptimal actions. In this simple example the bad action
was chosen on the first iteration, but in general bad actions
may be chosen throughout a run, and discounting may be
useful far beyond the first few iterations.
Discounting prior iterations has received relatively lit-
tle attention in the equilibrium-finding community. “Opti-
mistic” regret minimizing variants exist that assign a higher
weight to recent iterations, but this extra weight is tempo-
rary and typically only applies to a short window of re-
cent iterations; for example, counting the most recent it-
erate twice (Syrgkanis et al. 2015). We investigate opti-
mistic regret minimizers as part of CFR later in this paper.
CFR+ discounts prior iterations’ contribution to the aver-
age strategy, but not the regrets. Discounting prior iterations
has also been used in CFR for situations where the game
structure changes, for example due to interleaved abstrac-
tion and equilibrium finding (Brown and Sandholm 2014;
Brown and Sandholm 2015b). There has also been some
work on applying discounting to perfect-information game
solving in Monte Carlo Tree Search (Hashimoto et al. 2011).
Outside of equilibrium finding, prior research has ana-
lyzed the theory for discounted regret minimization (Cesa-
Bianchi and Lugosi 2006). That work investigates applying
RM (and other regret minimizers) to a sequence of itera-
tions in which iteration t has weight wt (assuming wt ≤ 1
and the final iteration has weight 1). For RM, it proves that
if ∑∞
t=1 wt = ∞ then weighted average regret, defined as
Rw,T
i = maxa∈A
∑T
t=1(wtrt(a))
∑T
t=1 wt is bounded by
Rw,T
i ≤ ∆√|A|
√∑T
t=1 w2
t
∑T
t=1 wt
(6)
Prior work has shown that, in two-player zero-sum games, if
weighted average regret is , then the weighted average strat-
egy, defined as σw,T
i (I) =
∑
t∈T
(wtπσt
i (I)σt
i (I)
)
∑
t∈T (wtπσt
i (I)) for infoset
I, is a 2-Nash equilibrium (Brown and Sandholm 2014).
While there are a limitless number of discounting
schemes that converge in theory, not all of them perform
well in practice. This paper introduces a number of variants
that perform particularly well also in practice. The first algo-
rithm, which we refer to as linear CFR (LCFR), is identical
to CFR, except on iteration t the updates to the regrets and
average strategies are given weight t. That is, the iterates
are weighed linearly. (Equivalently, one could multiply the
accumulated regret by t
t+1 on each iteration. We do this in
our experiments to reduce the risk of numerical instability.)
This means that after T iterations of LCFR, the first itera-
tion only has a weight of 2
T 2+T on the regrets rather than a
weight of 1
T , which would be the case in CFR and CFR+. In
the motivating example introduced at the beginning of this
section, LCFR chooses the second action with 100% proba-
bility after only 970 iterations while CFR+ requires 471,407
iterations. Furthermore, from (6), the theoretical bound on
the convergence of regret is only greater than vanilla CFR
by a factor of 2√3 . One could more generally use any poly-
nomial weighting of t.
Since the changes from CFR that lead to LCFR and CFR+
do not conflict, it is natural to attempt to combine them into a
single algorithm that weighs each iteration t proportional to
t and also has a floor on regret at zero like CFR+. However,
we empirically observe that this algorithm, which we refer to
as LCFR+, actually leads to performance that is worse than
LCFR and CFR+ in the games we tested, even though its
theoretical bound on convergence is the same as for LCFR.
Nevertheless, we find that using a less-aggressive dis-
counting scheme leads to consistently strong performance.
We can consider a family of algorithms called Discounted
CFR with parameters α β, and γ (DCFRα,β,γ ), defined by
multiplying accumulated positive regrets by tα
tα +1 , negative
regrets by tβ
tβ +1 , and contributions to the average strategy by
( t
t+1 )γ on each iteration t. In this case, LCFR is equivalent
