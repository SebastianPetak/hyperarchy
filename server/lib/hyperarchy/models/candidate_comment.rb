class CandidateComment < Monarch::Model::Record
  column :body, :string
  column :candidate_id, :key
  column :creator_id, :key
  column :created_at, :datetime
  column :updated_at, :datetime

  belongs_to :candidate
  belongs_to :creator, :class_name => "User"

  def organization_ids
    election ? election.organization_ids : []
  end

  def election
    candidate.election
  end

  def can_create?
    election.organization.has_member?(current_user)
  end

  def can_update_or_destroy?
    current_user.admin? || creator_id == current_user.id || election.organization.has_owner?(current_user)
  end
  alias can_update? can_update_or_destroy?
  alias can_destroy? can_update_or_destroy?

  def create_whitelist
    [:body, :candidate_id]
  end

  def update_whitelist
    [:body]
  end

  def before_create
    self.creator ||= current_user
  end
end